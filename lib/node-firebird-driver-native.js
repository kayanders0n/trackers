const { createNativeClient, getDefaultLibraryFilename } = require("node-firebird-driver-native");

const connectionPath =
  "localhost:C:\\Users\\kvelastegui\\Documents\\ONE\\practicedb\\databases\\tracker_entertainment\\TRACKER.FDB";
  
const connectionOptions = {
  username: "SYSDBA",
  password: "masterkey",
  authPlugin: "Srp256",
};

async function connectToDatabase() {
  const client = createNativeClient(getDefaultLibraryFilename());

  try {
    const attachment = await client.connect(connectionPath, connectionOptions);
    const transaction = await attachment.startTransaction();

    const resultSet = await attachment.executeQuery(transaction, "SELECT * FROM GENRE");
    const rows = await resultSet.fetchAll();

    console.log(rows);

    await attachment.disconnect();
  } catch (error) {
    console.error("Database connection error:", error);
  } finally {
    await client.dispose();
  }
}

connectToDatabase();
