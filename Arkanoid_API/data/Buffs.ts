export enum BuffTypes {
  PaddleSpeed = 0,
  AddLive = 1,
  SpeedBuff = 2,
  InvincibilityBuff = 3,
  DestroyerBuff = 4,
}

export interface Buff {
  id: number;
  color: string;
  description: string;
  pathToImage: string;
}

export const tabOfBuffs: Buff[] = [
  {
    id: BuffTypes.PaddleSpeed,
    color: "FF0000",
    description: "enchances your paddle speed",
    pathToImage: "http://localhost:3002/public/buffs/noimage.png",
  },
  {
    id: BuffTypes.AddLive,
    color: "00FF00",
    description: "Adds one live",
    pathToImage: "http://localhost:3002/public/buffs/noimage.png",
  },
  {
    id: BuffTypes.SpeedBuff,
    color: "0000FF",
    description: "enchances your ball and paddle speed by small amounts",
    pathToImage: "http://localhost:3002/public/buffs/noimage.png",
  },
  {
    id: BuffTypes.InvincibilityBuff,
    color: "#ffff00",
    description:
      "I dont have any idea what this buff should do, for now it is just a showcase",
    pathToImage: "http://localhost:3002/public/buffs/noimage.png",
  },
  {
    id: BuffTypes.DestroyerBuff,
    color: "#FF00FF",
    description:
      "I dont have any idea what this buff should do, for now it is just a showcase",
    pathToImage: "http://localhost:3002/public/buffs/noimage.png",
  },
];

export const findProperBuff = (id: BuffTypes) => {
  return tabOfBuffs.find((item) => item.id == id);
};
