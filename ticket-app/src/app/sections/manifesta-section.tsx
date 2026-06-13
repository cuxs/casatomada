"use client";

import SectionHeader from "./section-header";

const MANIFESTO_BLOCKS = [
  { text: "casa tomada\nno es una fiesta,\nno es ni desconexión,\nni relax,\nni entretenimiento", emphasis: false },
  { text: "casa tomada es\nla posibilidad de vivir una\nficción más adecuada,\nmás placentera.", emphasis: false },
  { text: "una ficción en la que podamos encontrarnos\nsiendo parte de esta carne latente y vibrante,\nmultiplicidad que se contagia\ncuando dejamos que el sonido\nnos parta al medio\npara dejar de ser lo que éramos", emphasis: false },
  { text: "tomar la casa es recuperar\nun territorio normalizado, homogéneo,\nexpropiado por el\nfascismo corporativo y\nsu máscara,\nel estado nación", emphasis: false },
  { text: "creemos que\nhoy más que nunca\ndebemos devolverle lo\nque fue en sus inicios:", emphasis: false },
  { text: "liberación,\nresistencia,\ndiversidad,\nexperimentación,\ncomunidad.", emphasis: true },
  { text: "pero un sueño\nviejo y lejano\nno nos basta,\nno cuestionamos para\nregresar a un pasado\nmejor. sino para darnos\nla posibilidad de\nimaginar juntxs\nun mundo en el que\nconvivan", emphasis: false },
  { text: "la fiesta y la reflexion\nel placer y la bronca\nel baile y la psicodelia\nla manija y el cuidado", emphasis: true },
  { text: "tomar la casa es un hacer\nque requiere poner el cuerpo\na experimentar nuevos movimientos,\npara asi poder pensar diferente.", emphasis: false },
  { text: "requiere esquivar la anestesia\nde las pantallas\npara mirarnos a los ojos\ny darnos cuenta de que\nsolo estando juntxs\npodemos enfrentar aquello\nque nos oprime", emphasis: false },
  { text: "porque si\ntodxs\nestamos\nrotxs que\nmejor que\nestar unidxs\ny organizadxs", emphasis: true },
  { text: "para la casa tomada:\nla salida es colectiva,\nla contracultura\nse construye,\nla paz nunca fue la solución,\nel baile y la música\nsiempre fueron espacios de resistencia", emphasis: false },
];

export default function ManifiestaSection({ onBack }: { onBack: () => void }) {
  return (
    <div className="relative min-h-screen bg-[#080000]">
      <SectionHeader onBack={onBack} backSide="right" />

      {/* Tiled background — absolute so it stretches with scrollable content */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-repeat opacity-40 saturate-50"
          style={{ backgroundImage: "url('/manifiesta/M01.webp')", backgroundSize: "60% auto" }}
        />
        <div className="absolute inset-0 bg-[rgba(8,0,0,0.55)]" />
      </div>

      {/* Content */}
      <div className="relative z-[1] pt-[100px] px-6 pb-20 max-w-[600px] mx-auto">
        <img src="/svg/manifiesta.svg" alt="manifiesta" width={747} height={126} className="w-full opacity-85 mb-[8vh]" />

        <div className="flex flex-col gap-[8vh]">
          {MANIFESTO_BLOCKS.map((block, i) => (
            <p
              key={i}
              className={[
                "font-epilogue tracking-[-0.05em] leading-[1.15] m-0 whitespace-pre-line",
                block.emphasis
                  ? "font-extrabold text-[clamp(28px,8vw,68px)] text-[rgba(210,210,210,0.9)]"
                  : "font-medium text-[clamp(20px,5.5vw,50px)] text-[rgba(170,170,170,0.75)]",
              ].join(" ")}
            >
              {block.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
