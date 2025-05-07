const { createNativeClient, getDefaultLibraryFilename } = require("node-firebird-driver-native");

const connectionPath =
  "localhost:C:\\Users\\kvelastegui\\Desktop\\MISC\\practicedb\\trackers\\databases\\TRACKER.FDB";
  
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

    const resultSet = await attachment.executeQuery(transaction, "SELECT * FROM ITEM");
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
