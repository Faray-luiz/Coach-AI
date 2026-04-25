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
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [processedFiles, setProcessedFiles] = useState<KnowledgeFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);

  // Carregar arquivos já processados
  const fetchFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const response = await fetch('/api/knowledge');
      if (response.ok) {
        const data = await response.json();
        setProcessedFiles(data);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/knowledge/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.status === 413) {
        throw new Error("O arquivo é muito grande para o servidor (limite de 4.5MB no Vercel).");
      }

      const data = await response.json();
      if (data.error) throw new Error(data.details || data.error);

      setStatus({ 
        type: 'success', 
        message: `Sucesso! O arquivo "${file.name}" foi processado.` 
      });
      setFile(null);
      fetchFiles(); // Atualiza a lista
    } catch (error: any) {
      setStatus({ 
        type: 'error', 
        message: error.message || "Erro ao enviar arquivo."
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Tem certeza que deseja excluir todo o conhecimento vindo de "${filename}"?`)) return;

    setIsDeleting(filename);
    try {
      const response = await fetch(`/api/knowledge?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProcessedFiles(prev => prev.filter(f => f.name !== filename));
      } else {
        alert("Erro ao excluir arquivo.");
      }
    } catch (error) {
      console.error("Delete Error:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Database className="text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Base de Conhecimento</h1>
          <p className="text-foreground/40 mt-1 text-sm sm:text-base">
            Alimente e gerencie o cérebro da Simi com metodologias e guias.
          </p>
        </header>

        <main className="space-y-12">
          {/* Section: Upload */}
          <section 
            className="glass rounded-3xl p-8 border-dashed border-2 border-white/10 hover:border-primary/30 transition-all group cursor-pointer"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="text-foreground/20 group-hover:text-primary transition-colors" />
              </div>
              
              <div className="flex flex-col items-center">
                <span className="text-lg font-semibold text-foreground">
                  {file ? file.name : 'Treinar Novo Arquivo'}
                </span>
                <input 
                  id="file-upload"
                  type="file" 
                  className="sr-only" 
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {!file && (
                  <p className="text-sm text-foreground/40 mt-2">
                    Arraste ou clique para enviar PDF, DOCX ou TXT
                  </p>
                )}
              </div>

              {file && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpload();
                  }}
                  disabled={isUploading}
                  className="mt-8 px-8 py-3 bg-primary rounded-xl font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/80 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={18} /> : null}
                  {isUploading ? 'Processando...' : 'Iniciar Treinamento'}
                </button>
              )}
            </div>
          </section>

          {status && (
            <div className={`p-6 rounded-2xl flex items-start gap-4 animate-fade-in ${
              status.type === 'success' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
            }`}>
              {status.type === 'success' ? <CheckCircle className="text-green-500 shrink-0" /> : <AlertCircle className="text-red-500 shrink-0" />}
              <div>
                <h4 className={`font-bold ${status.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                  {status.type === 'success' ? 'Sucesso' : 'Erro'}
                </h4>
                <p className="text-sm text-foreground/60 mt-1">{status.message}</p>
              </div>
            </div>
          )}

          {/* Section: My Files */}
          <section>
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <FileBox className="text-primary" size={24} />
              Arquivos Processados ({processedFiles.length})
            </h3>

            {isLoadingFiles ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : processedFiles.length === 0 ? (
              <div className="glass rounded-3xl p-12 text-center border border-white/5">
                <FileText className="mx-auto text-foreground/10 mb-4" size={48} />
                <p className="text-foreground/40">Nenhum arquivo treinado ainda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {processedFiles.map((f) => (
                  <div key={f.name} className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{f.name}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-foreground/40 flex items-center gap-1">
                            <Calendar size={12} /> {new Date(f.processed_at).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-xs text-foreground/40 flex items-center gap-1">
                            <Database size={12} /> {f.chunks_count} pedaços
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(f.name)}
                      disabled={isDeleting === f.name}
                      className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                      title="Excluir do cérebro"
                    >
                      {isDeleting === f.name ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section: Tips */}
          <section className="glass rounded-3xl p-8 border border-white/5">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
              <AlertCircle className="text-foreground/40" size={20} /> 
              Dicas de Gerenciamento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-foreground/50">
              <div className="space-y-2">
                <strong className="text-foreground/70 block">Exclusão é Permanente</strong>
                Ao excluir um arquivo, a Simi perderá instantaneamente todo o contexto que aprendeu com ele.
              </div>
              <div className="space-y-2">
                <strong className="text-foreground/70 block">Atualização de Conteúdo</strong>
                Se o guia mudar, exclua a versão antiga e suba a nova para evitar conflitos de informação.
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

