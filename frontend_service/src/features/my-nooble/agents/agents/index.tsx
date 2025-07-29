import { useEffect, useCallback } from 'react';
import { useLocation } from '@tanstack/react-router';
import { usePageContext } from '@/context/page-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AgentsAgentsPage() {
  const { setSubPages } = usePageContext();
  const location = useLocation();

  const updateSubPages = useCallback(() => {
    const currentPath = location.pathname;
    const subPages = [
      {
        title: 'Team',
        href: '/my-nooble/agents/team',
        isActive: currentPath === '/my-nooble/agents/team'
      },
      {
        title: 'Agents',
        href: '/my-nooble/agents/agents',
        isActive: currentPath === '/my-nooble/agents/agents'
      },
      {
        title: 'Knowledge',
        href: '/my-nooble/agents/knowledge',
        isActive: currentPath === '/my-nooble/agents/knowledge'
      },
      {
        title: 'Tools',
        href: '/my-nooble/agents/tools',
        isActive: currentPath === '/my-nooble/agents/tools'
      }
    ];
    setSubPages(subPages);
  }, [location.pathname, setSubPages]);

  useEffect(() => {
    updateSubPages();

    return () => {
      setSubPages([]);
    };
  }, [updateSubPages, setSubPages]);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Agent Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Manage your agents and their permissions here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
