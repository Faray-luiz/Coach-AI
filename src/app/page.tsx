import { ArrowRight, Brain, Target, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center animate-fade-in-up">
      {/* Hero */}
      <section className="w-full bg-surface border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-20 sm:py-28 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-light px-4 py-1.5 text-xs font-semibold text-primary mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Simi Treinadora 2.0 · RAG Enabled
          </span>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Transforme conversas em<br />
            <span className="text-primary">dados de aprendizado</span>
          </h1>

          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            Análise comportamental baseada em IA para elevar a qualidade das mentorias e acelerar o desenvolvimento de talentos.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/test-analysis"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors"
            >
              Testar Análise <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/knowledge"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors"
            >
              Subir Arquivos
            </Link>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="w-full max-w-5xl mx-auto px-6 py-16 sm:py-24">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={<Brain className="h-6 w-6 text-primary" />}
            title="Análise Profunda"
            description="Avaliação baseada em clareza, profundidade, conexão, eficiência e consistência."
          />
          <FeatureCard
            icon={<Target className="h-6 w-6 text-primary" />}
            title="Feedback Acionável"
            description="Micro-ajustes práticos para evolução contínua do mentor a cada sessão."
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6 text-primary" />}
            title="Impacto em Escala"
            description="Acompanhamento consolidado da qualidade do programa de mentoria."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="card rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary-light">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}
