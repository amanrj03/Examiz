import TestList from '@/components/dashboard/TestList';
export default function LiveTestsPage() {
  return <TestList filter="live" title="Live Tests" subtitle="Currently active — students can start these within the scheduled window." />;
}
