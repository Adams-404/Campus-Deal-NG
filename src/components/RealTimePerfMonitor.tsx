import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface PagePerf {
  path: string;
  fcp: number;
  lcp: number;
  timestamp: number;
}

export const RealTimePerfMonitor = () => {
  const [history, setHistory] = useState<PagePerf[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const observersRef = useRef<any>({});

  // Helper to get FCP/LCP for current page
  const measurePerf = (path: string) => {
    let fcp = 0;
    let lcp = 0;
    let fcpDone = false;
    let lcpDone = false;
    const now = Date.now();

    // FCP
    const fcpObs = new PerformanceObserver((list) => {
      const entries = list.getEntriesByName('first-contentful-paint');
      if (entries.length > 0 && !fcpDone) {
        fcp = Math.round(entries[0].startTime);
        fcpDone = true;
        fcpObs.disconnect();
        update();
      }
    });
    fcpObs.observe({ type: 'paint', buffered: true });

    // LCP
    const lcpObs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        lcp = Math.round(entries[entries.length - 1].startTime);
        lcpDone = true;
        lcpObs.disconnect();
        update();
      }
    });
    lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });

    function update() {
      if (fcpDone && lcpDone) {
        setHistory(prev => [
          { path, fcp, lcp, timestamp: now },
          ...prev.filter(h => h.path !== path)
        ]);
      }
    }

    // Store refs for cleanup
    observersRef.current[path] = [fcpObs, lcpObs];
  };

  // On route change, measure perf for new page
  useEffect(() => {
    measurePerf(location.pathname);
    return () => {
      // Clean up observers for previous page
      Object.values(observersRef.current).forEach((arr: any) => {
        arr.forEach((obs: any) => obs.disconnect && obs.disconnect());
      });
      observersRef.current = {};
    };
    // eslint-disable-next-line
  }, [location.pathname]);

  if (isCollapsed) {
    return (
      <div className="fixed bottom-4 right-96 z-50">
        <button
          onClick={() => setIsCollapsed(false)}
          className="h-8 w-8 p-0 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center"
          title="Show Real-Time Perf Monitor"
        >
          <Zap className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-96 z-50">
      <Card className="w-96 bg-background/95 backdrop-blur-sm border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Real-Time Perf
            </CardTitle>
            <div className="flex gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0 flex items-center justify-center"
                title={isExpanded ? 'Collapse Details' : 'Expand Details'}
              >
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              <button
                onClick={() => setIsCollapsed(true)}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex items-center justify-center"
                title="Hide Monitor"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Real-time FCP/LCP per page (auto-updates on navigation)
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-2">
            {history.length === 0 && (
              <div className="text-xs text-muted-foreground">No data yet. Navigate pages to see real-time metrics.</div>
            )}
            {history.slice(0, isExpanded ? 10 : 3).map((h, i) => (
              <div key={h.path + h.timestamp} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">{h.path}</span>
                </span>
                <div className="flex items-center gap-2">
                  <Badge className="text-xs bg-blue-100 text-blue-800">FCP: {h.fcp}ms</Badge>
                  <Badge className="text-xs bg-blue-100 text-blue-800">LCP: {h.lcp}ms</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
