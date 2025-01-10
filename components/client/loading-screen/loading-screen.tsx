import { LoaderCircle } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <LoaderCircle className="h-8 w-8 animate-spin" />
    </div>
  );
}