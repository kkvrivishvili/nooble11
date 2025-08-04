// src/api/agents-api.ts
import { supabase } from '@/lib/supabase';
import { Agent, AgentTemplate } from '@/types/profile';
import { PostgrestError, AuthError } from '@supabase/supabase-js';

// Helper Functions
const handleApiError = (error: PostgrestError | AuthError | null, context: string) => {
  if (error) {
    console.error(`Error in ${context}:`, error.message);
    throw new Error(`A problem occurred in ${context}: ${error.message}`);
  }
};

const getUserId = async (): Promise<string> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  handleApiError(error, 'session check');
  if (!session?.user?.id) throw new Error('User not authenticated.');
  return session.user.id;
};

class AgentsAPI {
  /**
   * Get all agent templates (public, no auth required)
   */
  async getAgentTemplates(): Promise<AgentTemplate[]> {
    const { data, error } = await supabase
      .from('agentTemplates')
      .select('*')
      .eq('isActive', true)
      .order('name');

    handleApiError(error, 'getAgentTemplates');
    return data || [];
  }

  /**
   * Get user's agents
   */
  async getUserAgents(): Promise<Agent[]> {
    const userId = await getUserId();
    
    const { data, error } = await supabase
      .from('agents_with_prompt') // Using the view to get systemPrompt
      .select('*')
      .eq('userId', userId)
      .eq('isActive', true)
      .order('createdAt', { ascending: false });

    handleApiError(error, 'getUserAgents');
    return data || [];
  }

  /**
   * Get public agents by profile ID (for public profiles)
   */
  async getPublicAgentsByProfile(profileId: string): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agents_with_prompt')
      .select('*')
      .eq('userId', profileId)
      .eq('isActive', true)
      .eq('isPublic', true)
      .order('name');

    handleApiError(error, 'getPublicAgentsByProfile');
    return data || [];
  }

  /**
   * Get agent by ID (checks ownership or public access)
   */
  async getAgentById(agentId: string): Promise<Agent | null> {
    const { data, error } = await supabase
      .from('agents_with_prompt')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      handleApiError(error, 'getAgentById');
    }

    return data;
  }

  /**
   * Create agent from template
   */
  async createAgentFromTemplate(
    templateId: string, 
    customName?: string
  ): Promise<Agent> {
    const userId = await getUserId();

    const { data: agentId, error } = await supabase
      .rpc('copy_agent_from_template', {
        p_user_id: userId,
        p_template_id: templateId,
        p_agent_name: customName
      });

    handleApiError(error, 'createAgentFromTemplate');

    // Fetch the created agent
    const agent = await this.getAgentById(agentId);
    if (!agent) {
      throw new Error('Failed to fetch created agent');
    }

    return agent;
  }

  /**
   * Create custom agent (not from template)
   */
  async createCustomAgent(agentData: {
    name: string;
    description?: string;
    icon?: string;
    systemPrompt: string;
    isPublic?: boolean;
  }): Promise<Agent> {
    const userId = await getUserId();

    // Default config objects
    const defaultQueryConfig = {
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      maxTokens: 4096,
      topP: 0.9,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      stream: true
    };

    const defaultRagConfig = {
      embeddingModel: "text-embedding-3-small",
      embeddingDimensions: 1536,
      chunkSize: 512,
      chunkOverlap: 50,
      topK: 10,
      similarityThreshold: 0.7,
      hybridSearch: false,
      rerank: false
    };

    const defaultExecutionConfig = {
      historyEnabled: true,
      historyWindow: 10,
      historyTtl: 3600,
      maxIterations: 5,
      timeoutSeconds: 30
    };

    const { data, error } = await supabase
      .from('agents')
      .insert({
        userId,
        templateId: null, // Custom agent
        name: agentData.name,
        description: agentData.description,
        icon: agentData.icon || '🤖',
        systemPromptOverride: agentData.systemPrompt,
        queryConfig: defaultQueryConfig,
        ragConfig: defaultRagConfig,
        executionConfig: defaultExecutionConfig,
        isPublic: agentData.isPublic ?? true,
        isActive: true
      })
      .select()
      .single();

    handleApiError(error, 'createCustomAgent');

    // Add agent to user's profile
    await this.addAgentToProfile(data.id);

    return data;
  }

  /**
   * Update agent
   */
  async updateAgent(
    agentId: string, 
    updates: Partial<Pick<Agent, 'name' | 'description' | 'icon' | 'systemPromptOverride' | 'isPublic' | 'isActive'>>
  ): Promise<Agent> {
    const userId = await getUserId();

    // Verify ownership
    const agent = await this.getAgentById(agentId);
    if (!agent || agent.userId !== userId) {
      throw new Error('Agent not found or access denied');
    }

    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', agentId)
      .eq('userId', userId) // Double check ownership
      .select()
      .single();

    handleApiError(error, 'updateAgent');
    return data;
  }

  /**
   * Delete agent
   */
  async deleteAgent(agentId: string): Promise<void> {
    const userId = await getUserId();

    // Verify ownership
    const agent = await this.getAgentById(agentId);
    if (!agent || agent.userId !== userId) {
      throw new Error('Agent not found or access denied');
    }

    // Remove from profile first
    await this.removeAgentFromProfile(agentId);

    // Delete the agent (cascade will handle related data)
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId)
      .eq('userId', userId); // Double check ownership

    handleApiError(error, 'deleteAgent');
  }

  /**
   * Toggle agent visibility (public/private)
   */
  async toggleAgentVisibility(agentId: string): Promise<Agent> {
    const agent = await this.getAgentById(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    return this.updateAgent(agentId, { isPublic: !agent.isPublic });
  }

  /**
   * Duplicate agent
   */
  async duplicateAgent(agentId: string, newName?: string): Promise<Agent> {
    const userId = await getUserId();
    const originalAgent = await this.getAgentById(agentId);
    
    if (!originalAgent || originalAgent.userId !== userId) {
      throw new Error('Agent not found or access denied');
    }

    const duplicatedName = newName || `${originalAgent.name} (Copy)`;

    const { data, error } = await supabase
      .from('agents')
      .insert({
        userId,
        templateId: originalAgent.templateId,
        name: duplicatedName,
        description: originalAgent.description,
        icon: originalAgent.icon,
        systemPromptOverride: originalAgent.systemPromptOverride,
        queryConfig: originalAgent.queryConfig,
        ragConfig: originalAgent.ragConfig,
        executionConfig: originalAgent.executionConfig,
        isPublic: originalAgent.isPublic,
        isActive: true
      })
      .select()
      .single();

    handleApiError(error, 'duplicateAgent');

    // Add to profile
    await this.addAgentToProfile(data.id);

    return data;
  }

  /**
   * Update agent configuration (query, RAG, execution)
   */
  async updateAgentConfig(agentId: string, config: {
    queryConfig?: Agent['queryConfig'];
    ragConfig?: Agent['ragConfig'];
    executionConfig?: Agent['executionConfig'];
  }): Promise<Agent> {
    const userId = await getUserId();

    // Verify ownership
    const agent = await this.getAgentById(agentId);
    if (!agent || agent.userId !== userId) {
      throw new Error('Agent not found or access denied');
    }

    const updates: any = {};
    if (config.queryConfig) updates.queryConfig = config.queryConfig;
    if (config.ragConfig) updates.ragConfig = config.ragConfig;
    if (config.executionConfig) updates.executionConfig = config.executionConfig;

    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', agentId)
      .eq('userId', userId)
      .select()
      .single();

    handleApiError(error, 'updateAgentConfig');
    return data;
  }

  /**
   * Private helper: Add agent to user's profile
   */
  private async addAgentToProfile(agentId: string): Promise<void> {
    const userId = await getUserId();

    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('agents')
      .eq('id', userId)
      .single();

    handleApiError(fetchError, 'addAgentToProfile - fetch');

    const currentAgents = (profile.agents || []) as string[];
    if (!currentAgents.includes(agentId)) {
      const updatedAgents = [...currentAgents, agentId];

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          agents: updatedAgents,
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId);

      handleApiError(updateError, 'addAgentToProfile - update');
    }
  }

  /**
   * Private helper: Remove agent from user's profile
   */
  private async removeAgentFromProfile(agentId: string): Promise<void> {
    const userId = await getUserId();

    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('agents')
      .eq('id', userId)
      .single();

    handleApiError(fetchError, 'removeAgentFromProfile - fetch');

    const currentAgents = (profile.agents || []) as string[];
    const updatedAgents = currentAgents.filter(id => id !== agentId);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        agents: updatedAgents,
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId);

    handleApiError(updateError, 'removeAgentFromProfile - update');
  }

  /**
   * Get agent statistics for dashboard
   */
  async getAgentStats(agentId: string): Promise<{
    totalConversations: number;
    totalMessages: number;
    lastUsed?: string;
  }> {
    const userId = await getUserId();

    // Verify ownership
    const agent = await this.getAgentById(agentId);
    if (!agent || agent.userId !== userId) {
      throw new Error('Agent not found or access denied');
    }

    // Get conversation count
    const { count: conversationCount, error: convError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('agentId', agentId);

    // Get message count and last used
    const { data: messageStats, error: msgError } = await supabase
      .from('messages')
      .select('createdAt')
      .in('conversationId', 
        supabase
          .from('conversations')
          .select('id')
          .eq('agentId', agentId)
      )
      .order('createdAt', { ascending: false })
      .limit(1);

    return {
      totalConversations: conversationCount || 0,
      totalMessages: messageStats?.length || 0,
      lastUsed: messageStats?.[0]?.createdAt
    };
  }
}

export const agentsApi = new AgentsAPI();