export type ReadingPositionUpdate = {
  readonly type: 'READING_POSITION_UPDATE';
  readonly url: string;
  readonly scrollY: number;
  readonly scrollHeight: number;
  readonly viewportHeight: number;
  readonly progress: number;
};
