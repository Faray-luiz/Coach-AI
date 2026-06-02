'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Database, Trash2, Calendar, FileBox } from 'lucide-react';

interface KnowledgeFile {
  name: string;
  type: string;
  size: number;
  processed_at: string;
  chunks_count: number;
}

export default function KnowledgePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [processedFiles, setProcessedFiles] = useState<KnowledgeFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);

  const fetchFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch('/api/knowledge');
      if (res.ok) setProcessedFiles(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setStatus(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/knowledge/upload', { method: 'POST', body: formData });
      if (res.status === 413) throw new Error('Arquivo muito grande (limite 4.5 MB no Vercel).');
      const data = await res.json();
      if (data.error) throw new Error(data.details || data.error);
      setStatus({ type: 'success', message: `"${file.name}" processado com sucesso.` });
      setFile(null);
      fetchFiles();
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message || 'Erro ao enviar arquivo.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Excluir todo o conhecimento de "${filename}"?`)) return;
    setIsDeleting(filename);
    try {
      const res = await fetch(`/api/knowledge?filename=${encodeURIComponent(filename)}`, { method: 'DELETE' });
      if (res.ok) setProcessedFiles(prev => prev.filter(f => f.name !== filename));
      else alert('Erro ao excluir arquivo.');
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="bg-background min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-lg bg-primary-light flex items-center justify-center">
              <Database className="text-primary" size={18} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Base de Conhecimento</h1>
          </div>
          <p className="text-sm text-muted mt-1 ml-12">
            Alimente e gerencie o cérebro da Simi com metodologias e guias.
          </p>
        </header>

        <main className="space-y-6">
          {/* Upload area */}
          <div
            className="card rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer group p-8"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-primary-light transition-colors">
                <Upload size={24} className="text-muted group-hover:text-primary transition-colors" />
              </div>
              <p className="text-base font-semibold text-foreground">
                {file ? file.name : 'Clique ou arraste um arquivo aqui'}
              </p>
              {!file && <p className="text-sm text-muted mt-1">PDF, DOCX ou TXT — máx. 4.5 MB</p>}
              <input
                id="file-upload"
                type="file"
                className="sr-only"
                accept=".pdf,.docx,.txt"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
              {file && (
                <button
                  onClick={e => { e.stopPropagation(); handleUpload(); }}
                  disabled={isUploading}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {isUploading && <Loader2 className="animate-spin" size={16} />}
                  {isUploading ? 'Processando...' : 'Iniciar Treinamento'}
                </button>
              )}
            </div>
          </div>

          {/* Status alert */}
          {status && (
            <div className={`rounded-xl p-4 flex items-start gap-3 animate-fade-in-up border ${
              status.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {status.type === 'success'
                ? <CheckCircle size={18} className="shrink-0 mt-0.5 text-success" />
                : <AlertCircle size={18} className="shrink-0 mt-0.5 text-error" />}
              <p className="text-sm font-medium">{status.message}</p>
            </div>
          )}

          {/* File list */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileBox size={18} className="text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                Arquivos Processados
                <span className="ml-2 inline-flex items-center rounded-full bg-primary-light px-2 py-0.5 text-xs font-semibold text-primary">
                  {processedFiles.length}
                </span>
              </h3>
            </div>

            {isLoadingFiles ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={28} />
              </div>
            ) : processedFiles.length === 0 ? (
              <div className="card rounded-xl p-10 text-center">
                <FileText className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-sm text-muted">Nenhum arquivo treinado ainda.</p>
              </div>
            ) : (
              <div className="card rounded-xl divide-y divide-border overflow-hidden">
                {processedFiles.map(f => (
                  <div key={f.name} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                        <FileText size={18} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                        <div className="flex items-center gap-4 mt-0.5">
                          <span className="text-xs text-muted flex items-center gap-1">
                            <Calendar size={11} /> {new Date(f.processed_at).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-xs text-muted flex items-center gap-1">
                            <Database size={11} /> {f.chunks_count} chunks
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(f.name)}
                      disabled={isDeleting === f.name}
                      className="ml-4 p-2 rounded-lg text-muted hover:text-error hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Excluir"
                    >
                      {isDeleting === f.name
                        ? <Loader2 className="animate-spin" size={18} />
                        : <Trash2 size={18} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Tips */}
          <section className="card rounded-xl p-6 bg-gray-50">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
              <AlertCircle size={16} className="text-muted" /> Dicas de Gerenciamento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted">
              <div>
                <p className="font-semibold text-foreground mb-1">Exclusão é Permanente</p>
                Ao excluir um arquivo, a Simi perde todo o contexto aprendido com ele.
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Atualização de Conteúdo</p>
                Se o guia mudar, exclua a versão antiga e suba a nova para evitar conflitos.
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
