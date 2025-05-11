// Clear form function
function clearForm() {
  document.getElementById("movie-title-input").value = "";
  document.getElementById("release-date-input").value = "";
  document.getElementById("run-time-hours-input").value = "";
  document.getElementById("run-time-minutes-input").value = "";
  document.getElementById("series-checkbox").checked = false;
  document.getElementById("series-dropdown").value = "";
  document.getElementById("new-series-input").value = "";

  // Also hide the conditional fields
  document.getElementById("series-dropdown-wrapper").style.display = "none";
  document.getElementById("new-series-wrapper").style.display = "none";
};

document.addEventListener("DOMContentLoaded", () => {

  const seriesCheckbox = document.getElementById("series-checkbox");
  const seriesDropdownWrapper = document.getElementById("series-dropdown-wrapper");
  const seriesDropdown = document.getElementById("series-dropdown");
  const newSeriesWrapper = document.getElementById("new-series-wrapper");

  // Hide series dropdown and text input initially
  seriesDropdownWrapper.style.display = "none";
  newSeriesWrapper.style.display = "none";

  // Show/hide series dropdown when checkbox is checked
  seriesCheckbox.addEventListener("change", () => {
    if (seriesCheckbox.checked) {
      seriesDropdownWrapper.style.display = "block";
    } else {
      seriesDropdownWrapper.style.display = "none";           // hide dropdown
      newSeriesWrapper.style.display = "none";                // hide "New Series" input
      seriesDropdown.value = "";                              // reset dropdown
      document.getElementById("new-series-input").value = ""; // reset "New Series" input
    }
  });

  // Show/hide the new series input based on dropdown value
  seriesDropdown.addEventListener("change", () => {
    if (seriesDropdown.value === "New Series") {
      newSeriesWrapper.style.display = "block";
    } else {
      newSeriesWrapper.style.display = "none";                // hide "New Series" input
      document.getElementById("new-series-input").value = ""; // reset "New Series" input
    }
  });

  // Save Button - display user input in concole
  document.getElementById("saveButton").addEventListener("click", () => {
    const movieTitle = document.getElementById("movie-title-input").value;
    const releaseDate = document.getElementById("release-date-input").value;
    const runTimeHours = document.getElementById("run-time-hours-input").value;
    const runTimeMinutes = document.getElementById("run-time-minutes-input").value;
    const isSeries = document.getElementById("series-checkbox").checked;
    const seriesName = document.getElementById("series-dropdown").value;    
    const newSeriesName = document.getElementById("new-series-input").value;

    const runTimeTotalMin = (parseInt(runTimeHours) * 60) + parseInt(runTimeMinutes);

    if (movieTitle === "") {
      console.log("Please Enter Movie Title.");
    } else if (isSeries && !seriesName) {
      console.log("Please Select a Series.");
    } else if (seriesName === "New Series" && !newSeriesName) {
      console.log("Please Provide Name of New Series.");
    } else {
      console.log("Movie Title:", movieTitle);
      console.log("Release Date:", releaseDate);
      console.log("Run Time:", `${runTimeHours}h ${runTimeMinutes}m`);
      console.log("Run Time Total Min:", runTimeTotalMin);
      console.log("Is part of a series:", isSeries ? "Yes" : "No");
      console.log("Selected Genre:", seriesName || "None selected");
      console.log("Selected Name:", newSeriesName || "None selected");
  
      console.log("Input Saved.");
      clearForm();
    }
  });

  // Cancel Button - clear user input
  document.getElementById("cancelButton").addEventListener("click", () => {
    clearForm();
    console.log("Form Cleared.");
  });
});



/**
 * Fetches and displays a list of friends from the API
 * Makes a GET request to /api/friends endpoint and updates the UI with the results
 */
/**async function getFriends() {
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
        friendsList += `${friend.NAME}\n`;
      }
      // Update UI with list of friend names
      document.getElementById("friendsList").value = friendsList;
    }
  } catch (error) {
    // Handle any errors that occur during API call
    document.getElementById("friendsList").value = "Error fetching data";
  }
}

async function addFriend() {
  const newFriend = document.getElementById("newFriend").value;
  console.log(newFriend);
  if (!newFriend) {
    document.getElementById("friendsList").value = "Name is required";
    return;
  }

  const response = await fetch("/api/addFriend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: newFriend }),
  });

  if (response.ok) {
    getFriends();
  } else {
    document.getElementById("friendsList").value = response.error;
  }
}

*/