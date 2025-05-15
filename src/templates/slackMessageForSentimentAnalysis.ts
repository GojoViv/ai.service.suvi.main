export const slackMessageForSentimentAnalysis = (analysis: any[]) => {
  let message = "*Today's Sentiment Analysis*\n\n";

  analysis.forEach((anal: any) => {
    message += `*Channel ID:* ${anal.channelId}\n
*Total Messages:* ${anal.totalMessages}\n
*Positive Sentiment (%):* ${anal.positivePercentage}\n
*Neutral Sentiment (%):* ${anal.neutralPercentage}\n
*Negative Sentiment (%):* ${anal.negativePercentage}\n
`;
  });

  return message;
};
