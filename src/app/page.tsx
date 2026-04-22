import { ArrowRight, Brain, Target, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 sm:py-32 lg:px-8 animate-fade-in-up">
      <div className="max-w-2xl text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold leading-6 text-primary ring-1 ring-inset ring-primary/20">
            Simi Treinadora Beta
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Transforme conversas em <span className="text-primary">dados de aprendizado</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-foreground/60">
          Análise comportamental baseada em IA para elevar a qualidade das mentorias e acelerar o desenvolvimento de talentos.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <button className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all flex items-center gap-2">
            Começar Agora <ArrowRight className="h-4 w-4" />
          </button>
          <a href="#" className="text-sm font-semibold leading-6 text-foreground">
            Ver Demo <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-3 max-w-5xl">
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
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="glass group rounded-3xl p-8 hover:bg-white/[0.05] transition-all">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-foreground/60 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
