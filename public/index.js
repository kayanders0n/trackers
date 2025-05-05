/**
 * Fetches and displays a list of friends from the API
 * Makes a GET request to /api/friends endpoint and updates the UI with the results
 */
async function getFriends() {
  try {
    // Make API request to fetch friends data
    const response = await fetch("/api/friends");
    const data = await response.json();

    // Get reference to the friends list textarea/input element
    if (data.error) {
      // Display error message if API returns an error
      document.getElementById("friendsList").value = data.error;
    } else {
      // Initialize empty string to store friend names
      let friendsList = "";

      // Iterate through friends data and build display string
      for (const friend of data) {
        friendsList += `${friend.DESCRIPT}\n`;
      }
      // Update UI with list of friend names
      document.getElementById("friendsList").value = friendsList;
    }
  } catch (error) {
    // Handle any errors that occur during API call
    document.getElementById("friendsList").value = "Error fetching data";
  }
}
