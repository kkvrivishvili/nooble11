import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePageContext } from '@/context/page-context';

export default function DesignPage() {
  const { setTitle } = usePageContext();

  useEffect(() => {
    setTitle('Design');
    
   
    
    // Cleanup: limpiar sub-páginas cuando se desmonte
    return () => {
    }
  }, [setTitle])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Design</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Customize the design and appearance of your Nooble.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
