'use client';

import { useState, useEffect } from 'react';

interface BucketInfo {
  name: string;
  exists: boolean;
  error?: {
    message: string;
    code: string;
  } | null;
}

interface FirebaseConfig {
  projectId: string;
  storageBucket: string;
  hasClientEmail: boolean;
  hasPrivateKey: boolean;
  isInitialized: boolean;
}

export default function BucketChecker() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bucketInfo, setBucketInfo] = useState<BucketInfo | null>(null);
  const [defaultBucketInfo, setDefaultBucketInfo] = useState<BucketInfo | null>(null);
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig | null>(null);
  const [creatingBucket, setCreatingBucket] = useState(false);
  const [createBucketResult, setCreateBucketResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  
  useEffect(() => {
    checkBucket();
  }, []);
  
  async function checkBucket() {
    try {
      setLoading(true);
      setError(null);
      setCreateBucketResult(null);
      
      const response = await fetch('/api/storage/bucket-info');
      
      if (!response.ok) {
        throw new Error(`Erro ao verificar bucket: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido ao verificar bucket');
      }
      
      setBucketInfo(data.bucket);
      setDefaultBucketInfo(data.defaultBucket);
      setFirebaseConfig(data.firebaseConfig);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao verificar bucket:', err);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleCreateBucket() {
    if (!firebaseConfig?.projectId) {
      setError('Project ID não está definido');
      return;
    }
    
    try {
      setCreatingBucket(true);
      setError(null);
      setCreateBucketResult(null);
      
      const bucketName = `${firebaseConfig.projectId}.appspot.com`;
      
      const response = await fetch('/api/storage/create-bucket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bucketName }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Erro ao criar bucket (${response.status})`);
      }
      
      setCreateBucketResult({
        success: true,
        message: data.message || 'Bucket criado com sucesso',
      });      
      
      await checkBucket();
    } catch (err: any) {
      setError(err.message);
      setCreateBucketResult({
        success: false,
        message: err.message,
      });
      console.error('Erro ao criar bucket:', err);
    } finally {
      setCreatingBucket(false);
    }
  }
  
  if (loading) {
    return (
      <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg shadow">
        <p className="text-center">Verificando configuração do Firebase Storage...</p>
      </div>
    );
  }
  
  if (error && !createBucketResult) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg">
        <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Erro ao verificar bucket</h3>
        <p className="mt-2 text-sm text-red-700 dark:text-red-400">{error}</p>
        <button
          onClick={checkBucket}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }  
  
  const hasBucketIssue = bucketInfo && (!bucketInfo.exists || bucketInfo.error);
  
  return (
    <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">Diagnóstico do Firebase Storage</h2>
      
      <div className="mb-4">
        <h3 className="font-medium mb-2">Configuração do Firebase</h3>
        <ul className="space-y-1 text-sm">
          <li>
            <span className="font-medium">Project ID:</span> {firebaseConfig?.projectId || 'Não definido'}
          </li>
          <li>
            <span className="font-medium">Storage Bucket:</span> {firebaseConfig?.storageBucket || 'Não definido'}
          </li>
          <li>
            <span className="font-medium">Cliente Email:</span> {firebaseConfig?.hasClientEmail ? 'Definido' : 'Não definido'}
          </li>
          <li>
            <span className="font-medium">Private Key:</span> {firebaseConfig?.hasPrivateKey ? 'Definido' : 'Não definido'}
          </li>
          <li>
            <span className="font-medium">Firebase Inicializado:</span> {firebaseConfig?.isInitialized ? 'Sim' : 'Não'}
          </li>
        </ul>
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium mb-2">Bucket Atual</h3>
        {bucketInfo && (
          <div>
            <p className="text-sm"><span className="font-medium">Nome:</span> {bucketInfo.name}</p>
            <p className="text-sm"><span className="font-medium">Existe:</span> {bucketInfo.exists ? 'Sim' : 'Não'}</p>
            {bucketInfo.error && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-400">
                <p><span className="font-medium">Erro:</span> {bucketInfo.error.message}</p>
                <p><span className="font-medium">Código:</span> {bucketInfo.error.code}</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {defaultBucketInfo && defaultBucketInfo.name !== bucketInfo?.name && (
        <div className="mb-4">
          <h3 className="font-medium mb-2">Bucket Padrão</h3>
          <p className="text-sm"><span className="font-medium">Nome:</span> {defaultBucketInfo.name}</p>
          <p className="text-sm"><span className="font-medium">Existe:</span> {defaultBucketInfo.exists ? 'Sim' : 'Não'}</p>
        </div>
      )}
      
      {createBucketResult && (
        <div className={`mt-4 p-3 rounded-lg ${createBucketResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50'}`}>
          <h3 className={`text-md font-medium ${createBucketResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
            {createBucketResult.success ? 'Operação bem-sucedida' : 'Erro na operação'}
          </h3>
          <p className={`mt-2 text-sm ${createBucketResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {createBucketResult.message}
          </p>
        </div>
      )}
      
      {hasBucketIssue && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg">
          <h3 className="text-md font-medium text-yellow-800 dark:text-yellow-300">Problema detectado com o bucket</h3>
          <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
            O bucket especificado não existe ou não está acessível. Verifique se:
          </p>
          <ul className="mt-2 list-disc list-inside text-sm text-yellow-700 dark:text-yellow-400">
            <li>O nome do bucket está correto nas variáveis de ambiente</li>
            <li>O bucket foi criado no console do Firebase</li>
            <li>As permissões da conta de serviço estão configuradas corretamente</li>
          </ul>
          
          <div className="mt-4">
            <button
              onClick={handleCreateBucket}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-yellow-400"
              disabled={creatingBucket}
            >
              {creatingBucket ? 'Criando bucket...' : 'Tentar criar bucket padrão'}
            </button>
            <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
              Nota: Esta operação tentará criar o bucket padrão ({firebaseConfig?.projectId}.appspot.com).
              Isso pode falhar se você não tiver permissões suficientes ou se o nome do bucket já estiver em uso por outro projeto.
            </p>
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="font-medium mb-2">Passos para corrigir</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Verifique se o bucket existe no <a href="https://console.firebase.google.com/project/_/storage" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">console do Firebase</a></li>
          <li>Certifique-se de que a variável de ambiente <code className="bg-gray-100 dark:bg-zinc-700 px-1 py-0.5 rounded">FIREBASE_STORAGE_BUCKET</code> está configurada corretamente no arquivo <code className="bg-gray-100 dark:bg-zinc-700 px-1 py-0.5 rounded">.env.local</code></li>
          <li>O formato correto é: <code className="bg-gray-100 dark:bg-zinc-700 px-1 py-0.5 rounded">{firebaseConfig?.projectId}.appspot.com</code></li>
          <li>Reinicie o servidor após fazer as alterações</li>
        </ol>
      </div>
      
      <div className="mt-6 flex justify-end">
        <button
          onClick={checkBucket}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Verificando...' : 'Verificar novamente'}
        </button>
      </div>
    </div>
  );
} 
