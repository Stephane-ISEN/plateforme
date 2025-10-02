import React, { useEffect, useState } from "react";
import { motion, useMotionValue } from "framer-motion";
import { Card as ShadCard } from "@/components/ui/Card"; // Import du composant Card de ShadCN
import { CardType } from "@/types"; // Import du type CardType


const cards: CardType[] = [
  {
    src: "/imgs/JRRTolkien.png",
    title: "J.R.R. Tolkien",
    id: 1,
  },
  {
    src: "/imgs/HPLovecraft.png",
    title: "H.P. Lovecraft",
    id: 2,
  },
  {
    src: "/imgs/NeilGaiman.png",
    title: "Neil Gaiman",
    id: 3,
  },
  {
    src: "/imgs/GeorgeOrwell.png",
    title: "George Orwell",
    id: 4,
  },
  {
    src: "imgs/SirArthurConanDoyle.png",
    title: "Sir Arthur Conan Doyle",
    id: 5,
  },
  {
    src: "imgs/StephenKing.png",
    title: "Stephen King",
    id: 6,
  },
  {
    src: "imgs/JulesVerne.png",
    title: "Jules Verne",
    id: 7,
  },
  {
    src: "imgs/EdgarAllanPoe.png",
    title: "Edgar Allan Poe",
    id: 8,
  },
  {
    src: "imgs/BramStoker.png",
    title: "Bram Stoker",
    id: 9,
  },
];

const ONE_SECOND = 1000;
const AUTO_DELAY = ONE_SECOND * 1000;
const DRAG_BUFFER = 50;

const SPRING_OPTIONS = {
  type: "spring",
  mass: 3,
  stiffness: 400,
  damping: 50,
};

export const SwipeCarousel = () => {
  const [imgIndex, setImgIndex] = useState(0);
  const dragX = useMotionValue(0);


  useEffect(() => {
    const intervalRef = setInterval(() => {
      const x = dragX.get();

      if (x === 0) {
        setImgIndex((pv) => {
          if (pv === cards.length - 1) {
            return 0;
          }
          return pv + 1;
        });
      }
    }, AUTO_DELAY);

    return () => clearInterval(intervalRef);
  }, [ dragX ]);

  const onDragEnd = () => {
    const x = dragX.get();

    if (x <= -DRAG_BUFFER && imgIndex < cards.length - 1) {
      setImgIndex((pv) => pv + 1);
    } else if (x >= DRAG_BUFFER && imgIndex > 0) {
      setImgIndex((pv) => pv - 1);
    }
  };

  return (
      <div className="relative overflow-hidden bg-transparent py-8 mt-8 rounded-lg">
        <div className="absolute top-0 left-0 w-full h-full">
          <ShadCard className="bg-transparent p-4 rounded-lg border-0">
            <h1 className="text-2xl text-[#dddee2] font-bold text-center">Culture Quiz</h1>
            <h2 className="text-center text-lg text-gray-500">Retrouve les écrivains associés</h2>
            <p className="text-center text-gray-600">Images généré par le model Flux dans notre application</p>
          </ShadCard>
        </div>
        <motion.div
            drag="x"
            dragConstraints={{
              left: 0,
              right: 0,
            }}
            style={{
              x: dragX,
            }}
            animate={{
              translateX: `-${imgIndex * 100}%`,
            }}
            transition={SPRING_OPTIONS}
            onDragEnd={onDragEnd}
            className="flex cursor-grab items-center active:cursor-grabbing mt-4"
        >
          <CardImages imgIndex={imgIndex}/>
        </motion.div>
        <div className="text-center text-gray-600 mt-0 pt-0">(clique au centre de l&apos;image pour découvrir la
          réponse)
        </div>
        <Dots imgIndex={imgIndex} setImgIndex={setImgIndex}/>

      </div>
  );
};

const CardImages = ({imgIndex}: { imgIndex: number }) => {
  const [visibleTexts, setVisibleTexts] = useState<boolean[]>(new Array(cards.length).fill(false));

  const handleTextClick = (idx: number) => {
    setVisibleTexts((prev) => {
      const newVisibility = [...prev];
      newVisibility[idx] = !newVisibility[idx];
      return newVisibility;
    });
  };

  return (
    <>
      {cards.map((card, idx) => (
        <motion.div
          key={card.id}
          style={{
            backgroundImage: `url(${card.src})`,
            backgroundPosition: "center",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
          }}
          animate={{
            scale: imgIndex === idx ? 0.75 : 0.65,
          }}
          transition={SPRING_OPTIONS}
          className="aspect-video w-full shrink-0 "
        >
          <div className="absolute inset-0 z-10 grid place-content-center">
            <p
              className={`p-8 text-4xl font-black uppercase transition-all duration-500 ${
                visibleTexts[idx] ? "text-white backdrop-blur-0 opacity-100" : "text-transparent backdrop-blur-lg opacity-5"
              } bg-gradient-to-br from-white/20 to-white/0 cursor-pointer`}
              onClick={() => handleTextClick(idx)}
            >
              {card.title}
            </p>
          </div>
        </motion.div>
      ))}
    </>
  );
};

// @ts-ignore
const Dots = ({imgIndex, setImgIndex}) => {
  return (
      <div className="mt-4 flex w-full justify-center gap-2">
        {cards.map((_, idx) => (
            <button
                key={idx}
                onClick={() => setImgIndex(idx)}
                className={`h-3 w-3 rounded-full transition-colors ${
                    idx === imgIndex ? "bg-neutral-50" : "bg-neutral-500"
          }`}
        />
      ))}
    </div>
  );
};


