import UploadTest from '@/components/UploadTest';
import BucketChecker from '@/components/BucketChecker';

export default function TestUploadPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Página de Teste de Upload</h1>
      
      <div className="mb-8">
        <BucketChecker />
      </div>
      
      <UploadTest />
    </div>
  );
} 