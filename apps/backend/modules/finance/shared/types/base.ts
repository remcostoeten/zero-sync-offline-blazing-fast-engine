type TTimestamps = {
  createdAt: Date;
  updatedAt: Date;
};

type TBaseEntity = {
  id: number;
} & TTimestamps;

export { TTimestamps, TBaseEntity };
