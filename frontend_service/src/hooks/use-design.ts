// src/hooks/use-design.ts
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { designApi } from '@/api/design-api';
import { ProfileDesign } from '@/types/profile';
import { useProfile } from '@/context/profile-context';
import { toast } from 'sonner';

export function useDesign() {
  const queryClient = useQueryClient();
  const { profile, refreshProfile } = useProfile();
  // Using sonner toast directly
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Get current design
  const { data: currentDesign, isLoading, error } = useQuery({
    queryKey: ['design', profile?.id],
    queryFn: () => designApi.getDesign(),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update design mutation
  const updateDesignMutation = useMutation({
    mutationFn: (design: Partial<ProfileDesign>) => designApi.updateDesign(design),
    onMutate: async (newDesign) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['design', profile?.id] });
      
      // Snapshot the previous value
      const previousDesign = queryClient.getQueryData(['design', profile?.id]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['design', profile?.id], (old: ProfileDesign | undefined) => {
        if (!old) return old;
        return {
          theme: { ...old.theme, ...(newDesign.theme || {}) },
          layout: { ...old.layout, ...(newDesign.layout || {}) }
        };
      });
      
      return { previousDesign };
    },
    onError: (err, newDesign, context) => {
      // If the mutation fails, use the context to roll back
      queryClient.setQueryData(['design', profile?.id], context?.previousDesign);
      
      toast.error("Error al guardar diseño. No se pudo guardar el diseño. Inténtalo de nuevo.");
    },
    onSuccess: () => {
      setHasUnsavedChanges(false);
      // Refresh the profile to get updated design
      refreshProfile();
      
      toast.success("Diseño guardado. Los cambios se han aplicado correctamente.");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['design', profile?.id] });
    },
  });

  // Apply preset mutation
  const applyPresetMutation = useMutation({
    mutationFn: (presetName: string) => designApi.applyPreset(presetName as any),
    onSuccess: (data) => {
      queryClient.setQueryData(['design', profile?.id], data);
      refreshProfile();
      setHasUnsavedChanges(false);
      
      toast.success("Preset aplicado. El preset se ha aplicado correctamente.");
    },
    onError: () => {
      toast.error("Error. No se pudo aplicar el preset.");
    }
  });

  // Reset to default mutation
  const resetToDefaultMutation = useMutation({
    mutationFn: () => designApi.resetToDefault(),
    onSuccess: (data) => {
      queryClient.setQueryData(['design', profile?.id], data);
      refreshProfile();
      setHasUnsavedChanges(false);
      
      toast.success("Diseño restablecido. Se ha restablecido el diseño por defecto.");
    },
    onError: () => {
      toast.error("Error. No se pudo restablecer el diseño.");
    }
  });

  // Update theme only
  const updateTheme = (theme: Partial<ProfileDesign['theme']>) => {
    updateDesignMutation.mutate({ theme });
  };

  // Update layout only
  const updateLayout = (layout: Partial<ProfileDesign['layout']>) => {
    updateDesignMutation.mutate({ layout });
  };

  // Apply preset
  const applyPreset = (presetName: string) => {
    applyPresetMutation.mutate(presetName);
  };

  // Reset to default
  const resetToDefault = () => {
    resetToDefaultMutation.mutate();
  };

  // Get available presets
  const getPresets = () => {
    return designApi.getPresets();
  };

  // Mark changes as unsaved
  const markAsChanged = () => {
    setHasUnsavedChanges(true);
  };

  return {
    // Data
    currentDesign,
    hasUnsavedChanges,
    isLoading,
    error,
    
    // Mutations
    updateDesign: updateDesignMutation.mutate,
    updateTheme,
    updateLayout,
    applyPreset,
    resetToDefault,
    
    // Utilities
    getPresets,
    markAsChanged,
    
    // Loading states
    isSaving: updateDesignMutation.isPending,
    isApplyingPreset: applyPresetMutation.isPending,
    isResetting: resetToDefaultMutation.isPending,
  };
}