interface FileToAnalyze {
  path: string;
  content: string;
  raw_file?: any;
}

interface ChunkAnalysisResult {
  fileReviews: {
    path: string;
    comment: string;
  }[];
  overallAnalysis: {
    codeStyle: { score: number; comments: string[] };
    architecture: { score: number; comments: string[] };
    performance: { score: number; comments: string[] };
    errorHandling: { score: number; comments: string[] };
  };
}
interface ReviewHistory {
  fileHash: string;
  path: string;
  comments: string[];
  resolved: boolean;
  lastReviewDate: Date;
}

interface FileData {
  path: string;
  content: string;
  raw_file: any;
  status: string;
}
interface DiffPosition {
  position: number;
  line: number;
  hunkStart: number;
}

export {
  FileToAnalyze,
  ChunkAnalysisResult,
  ReviewHistory,
  FileData,
  DiffPosition,
};
