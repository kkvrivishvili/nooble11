"""
Cliente para interactuar con la API de Groq usando el SDK oficial.
"""

import logging
from typing import Optional, Dict, Any, List, Tuple, Union

from groq import AsyncGroq, APIConnectionError, RateLimitError, APIStatusError
from common.errors.exceptions import ServiceUnavailableError


class GroqClient:
    """Cliente asíncrono para la API de Groq."""
    
    def __init__(self, api_key: str, timeout: int, max_retries: int):
        """
        Inicializa el cliente con la API key.
        
        Args:
            api_key: API key de Groq
            timeout: Timeout en segundos (desde QueryServiceSettings)
            max_retries: Número máximo de reintentos (desde QueryServiceSettings)
        """
        if not api_key:
            raise ValueError("API key de Groq es requerida")
        
        # Guardar configuración para clonar con with_options
        self.api_key = api_key
        self.timeout = timeout
        self.max_retries = max_retries

        self.client = AsyncGroq(
            api_key=api_key,
            timeout=timeout,
            max_retries=max_retries
        )
        
        self._logger = logging.getLogger(__name__)
        self._logger.setLevel(logging.DEBUG)

    def with_options(self, timeout: Optional[int] = None, max_retries: Optional[int] = None) -> 'GroqClient':
        """Devuelve una nueva instancia con timeout/max_retries personalizados."""
        new_client = GroqClient(
            api_key=self.api_key,
            timeout=timeout if timeout is not None else self.timeout,
            max_retries=max_retries if max_retries is not None else self.max_retries,
        )
        self._logger.debug(
            f"Cliente Groq clonado con opciones: timeout={new_client.timeout}s, "
            f"max_retries={new_client.max_retries}"
        )
        return new_client
    
    async def generate(
        self,
        prompt: str,
        system_prompt: str,
        model: str,
        temperature: float,
        max_tokens: int,
        top_p: float,
        frequency_penalty: float,
        presence_penalty: float,
        stop: Optional[Union[str, List[str]]] = None
    ) -> Tuple[str, Dict[str, int]]:
        """
        Genera una respuesta usando el modelo especificado.
        
        Returns:
            Tupla de (respuesta_generada, uso_de_tokens)
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            # Log resumen de la solicitud a Groq (sin contenido completo)
            try:
                self._logger.info(
                    "GroqClient.generate: preparando request",
                    extra={
                        "model": model,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                        "top_p": top_p,
                        "has_stop": bool(stop),
                        "prompt_len": len(prompt or ""),
                        "system_len": len(system_prompt or "")
                    }
                )
            except Exception:
                pass

            response = await self.client.chat.completions.create(
                messages=messages,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty,
                stop=stop
            )
            
            content = response.choices[0].message.content
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
            
            # Log resumen de la respuesta
            try:
                self._logger.info(
                    "GroqClient.generate: respuesta recibida",
                    extra={
                        "content_length": len(content or ""),
                        "usage": usage
                    }
                )
            except Exception:
                pass

            return content, usage
            
        except APIConnectionError as e:
            self._logger.debug(f"Error de conexión con Groq API: {e}")
            raise ServiceUnavailableError("Error de conexión con la API de Groq")
        
        except RateLimitError as e:
            self._logger.debug(f"Límite de peticiones excedido: {e}")
            raise ServiceUnavailableError("Límite de peticiones de Groq API excedido")
        
        except APIStatusError as e:
            self._logger.debug(f"Error de API de Groq: {e}")
            if 400 <= e.status_code < 500:
                raise ValueError(f"Error en la petición: {e.message}")
            raise ServiceUnavailableError(f"Error en el servidor de Groq: {e.message}")
    
    async def close(self):
        """Cierra el cliente."""
        await self.client.close()