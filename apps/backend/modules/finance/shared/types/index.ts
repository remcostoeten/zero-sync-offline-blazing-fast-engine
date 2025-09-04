export type TTimestamps = {
  createdAt: Date;
  updatedAt: Date;
};

export type TBaseEntity = {
  id: number;
} & TTimestamps;
