#!/bin/bash

SOURCE_DB=""
SOURCE_COLLECTION=""
TARGET_DB=""
TARGET_COLLECTION=""
EXPORT_FILE=""

mongoexport --uri $SOURCE_DB --collection $SOURCE_COLLECTION --out $EXPORT_FILE
if [ $? -ne 0 ]; then
  echo "Error: Failed to export collection from $SOURCE_DB.$SOURCE_COLLECTION"
  exit 1
fi

mongoimport --uri $TARGET_DB --collection $TARGET_COLLECTION --file $EXPORT_FILE
if [ $? -ne 0 ]; then
  echo "Error: Failed to import collection into $TARGET_DB.$TARGET_COLLECTION"
  exit 1
fi

rm $EXPORT_FILE
if [ $? -ne 0 ]; then
  echo "Warning: Failed to remove temporary export file"
fi

echo "Successfully migrated $SOURCE_DB.$SOURCE_COLLECTION to $TARGET_DB.$TARGET_COLLECTION"
