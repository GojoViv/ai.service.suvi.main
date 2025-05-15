export const removeBotMention = (
  userMessage: string,
  botUserId: string
): string => {
  const mention = `<@${botUserId}>`;
  return userMessage.replace(new RegExp(mention, "g"), "");
};
