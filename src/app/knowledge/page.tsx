'use client';

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Database } from 'lucide-react';

export default function KnowledgePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

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

      // Se o arquivo for muito grande, o Vercel/Next retorna 413 antes mesmo de chegar na nossa rota
      if (response.status === 413) {
        throw new Error("O arquivo é muito grande para o servidor (limite de 4.5MB no Vercel). Tente dividir o PDF em arquivos menores.");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Server returned non-JSON response:", text);
        throw new Error(`Erro inesperado do servidor (${response.status}). Verifique os logs de produção.`);
      }

      const data = await response.json();

      if (data.error) throw new Error(data.details || data.error);

      setStatus({ 
        type: 'success', 
        message: `Sucesso! O arquivo "${file.name}" foi processado em ${data.chunks_count} pedaços de conhecimento.` 
      });
      setFile(null);
    } catch (error: any) {
      console.error("Upload Error:", error);
      setStatus({ 
        type: 'error', 
        message: error.message || "Ocorreu um erro ao tentar enviar o arquivo."
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Database className="text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Base de Conhecimento</h1>
          <p className="text-foreground/40 mt-1 text-sm sm:text-base">
            Alimente a Simi com metodologias, guias e referências para análises mais precisas.
          </p>
        </header>

        <main className="space-y-8">
          <section className="glass rounded-3xl p-8 border-dashed border-2 border-white/10 hover:border-primary/30 transition-all group">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="text-foreground/20 group-hover:text-primary transition-colors" />
              </div>
              
              <label className="cursor-pointer">
                <span className="text-lg font-semibold text-foreground">
                  {file ? file.name : 'Selecione um arquivo'}
                </span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {!file && (
                  <p className="text-sm text-foreground/40 mt-2">
                    Arraste ou clique para enviar PDF, DOCX ou TXT
                  </p>
                )}
              </label>

              {file && (
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="mt-8 px-8 py-3 bg-primary rounded-xl font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/80 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} /> Processando...
                    </>
                  ) : (
                    <>Treinar Simi com este Arquivo</>
                  )}
                </button>
              )}
            </div>
          </section>

          {status && (
            <div className={`p-6 rounded-2xl flex items-start gap-4 animate-fade-in ${
              status.type === 'success' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
            }`}>
              {status.type === 'success' ? (
                <CheckCircle className="text-green-500 shrink-0" />
              ) : (
                <AlertCircle className="text-red-500 shrink-0" />
              )}
              <div>
                <h4 className={`font-bold ${status.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                  {status.type === 'success' ? 'Upload Concluído' : 'Erro no Processamento'}
                </h4>
                <p className="text-sm text-foreground/60 mt-1">{status.message}</p>
              </div>
            </div>
          )}

          <section className="glass rounded-3xl p-8">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
              <FileText className="text-foreground/40" size={20} /> 
              Dicas de Formato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-foreground/50">
              <div className="p-4 rounded-xl bg-white/5">
                <strong className="text-foreground/70 block mb-1">Qualidade do Texto</strong>
                Evite PDFs que são apenas imagens digitalizadas. O texto precisa ser selecionável.
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <strong className="text-foreground/70 block mb-1">Foco no Conteúdo</strong>
                Arquivos com até 50 páginas funcionam melhor para manter a precisão da busca.
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
