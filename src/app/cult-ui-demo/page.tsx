import { TextAnimate } from "@/components/ui/text-animate";

export default function CultUiDemoPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 text-center">
      <TextAnimate as="h1" by="character" animation="blurInUp" className="text-4xl font-bold">
        Cult UI funcionando
      </TextAnimate>
      <TextAnimate
        as="p"
        by="word"
        animation="fadeIn"
        delay={0.3}
        className="max-w-md text-text-muted"
      >
        Este es el componente TextAnimate de Cult UI, instalado a mano en el proyecto.
      </TextAnimate>
    </main>
  );
}
