import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getDatabase, ref, push, set, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

// Firebase configuration


   const firebaseConfig = {
    apiKey: "AIzaSyB3iJv4XVViLowqVB4yWjhNbdprjXEwvSY",
    authDomain: "blaze-z.firebaseapp.com",
    databaseURL: "https://blaze-z-default-rtdb.firebaseio.com",
    projectId: "blaze-z",
    storageBucket: "blaze-z.appspot.com",
    messagingSenderId: "856918814032",
    appId: "1:856918814032:web:bb615150a7821df0eb1055",
    measurementId: "G-9G9CXSQRR4"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

let tweetInput = document.getElementById('tweetInput');
let uploadTweetBtn = document.getElementById('uploadtweet');
let googleAuthBtn = document.getElementById('googleAuthBtn');
let tweetsContainer = document.getElementById('tweetsContainer');
let user = null;

// Google Sign-In
googleAuthBtn.addEventListener('click', () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      user = result.user;
      alert("Signed in as " + user.displayName);
      uploadTweetBtn.disabled = false;
    })
    .catch((error) => {
      alert("Failed to sign in: " + error.message);
    });
});

// On Auth State Changed
onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    user = currentUser;
    uploadTweetBtn.disabled = false;
    displayTweets();
  } else {
    user = null;
    uploadTweetBtn.disabled = true;
    tweetsContainer.innerHTML = "";
  }
});

// Add Tweet
uploadTweetBtn.addEventListener('click', () => {
  if (user && tweetInput.value.trim()) {
    const newTweetRef = push(ref(db, 'tweets/'));
    set(newTweetRef, {
      username: user.displayName,
      tweet: tweetInput.value,
      profilePic: user.photoURL || 'default-profile.png',
      likes: 0,
      dislikes: 0,
      likesUsers: {},
      dislikesUsers: {}
    })
    .then(() => {
      alert("Tweet added successfully");
      tweetInput.value = '';
      displayTweets();
    })
    .catch((error) => {
      alert("Failed to add tweet: " + error.message);
    });
  } else {
    alert("You must be signed in and write something to post a tweet.");
  }
});

// Handle Like/Dislike
function handleLikeDislike(tweetId, action) {
  if (user) {
    const tweetRef = ref(db, `tweets/${tweetId}`);
    onValue(tweetRef, (snapshot) => {
      let tweetData = snapshot.val();
      let userId = user.uid;

      // Ensure likesUsers and dislikesUsers are initialized
      tweetData.likesUsers = tweetData.likesUsers || {};
      tweetData.dislikesUsers = tweetData.dislikesUsers || {};

      // Check if the user has already liked or disliked the tweet
      let hasLiked = tweetData.likesUsers[userId];
      let hasDisliked = tweetData.dislikesUsers[userId];

      if (action === 'like') {
        if (!hasLiked && !hasDisliked) {
          tweetData.likesUsers[userId] = true;
          tweetData.likes = (tweetData.likes || 0) + 1;
        } else if (hasDisliked) {
          delete tweetData.dislikesUsers[userId];
          tweetData.dislikes = (tweetData.dislikes || 0) - 1;
          tweetData.likesUsers[userId] = true;
          tweetData.likes = (tweetData.likes || 0) + 1;
        }
      } else if (action === 'dislike') {
        if (!hasLiked && !hasDisliked) {
          tweetData.dislikesUsers[userId] = true;
          tweetData.dislikes = (tweetData.dislikes || 0) + 1;
        } else if (hasLiked) {
          delete tweetData.likesUsers[userId];
          tweetData.likes = (tweetData.likes || 0) - 1;
          tweetData.dislikesUsers[userId] = true;
          tweetData.dislikes = (tweetData.dislikes || 0) + 1;
        }
      }

      // Save the updated tweet data
      update(tweetRef, tweetData).then(() => {
        displayTweets(); // Refresh the displayed tweets
      }).catch((error) => {
        console.error("Error updating tweet:", error);
      });
    }, {
      onlyOnce: true
    });
  } else {
    alert("You must be signed in to like or dislike.");
  }
}

// Display Tweets
function displayTweets() {
  const tweetsRef = ref(db, 'tweets/');
  onValue(tweetsRef, (snapshot) => {
    tweetsContainer.innerHTML = "";
    const data = snapshot.val();
    for (let key in data) {
      const tweetData = data[key];
      let tweetElement = document.createElement('div');
      tweetElement.classList.add('tweet');

      tweetElement.innerHTML = `
        <img class="profile-pic" src="${tweetData.profilePic}" alt="${tweetData.username}">
        <div class="tweet-content">
          <strong>${tweetData.username}:</strong> ${tweetData.tweet}
        </div>
        <div>
          <span class="like-btn">Likes: ${tweetData.likes || 0}</span> | 
          <span class="dislike-btn">Dislikes: ${tweetData.dislikes || 0}</span>
        </div>
      `;

      // Add click events for like and dislike actions
      tweetElement.querySelector('.like-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        handleLikeDislike(key, 'like');
      });

      tweetElement.querySelector('.dislike-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        handleLikeDislike(key, 'dislike');
      });

      tweetsContainer.appendChild(tweetElement);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
   const menuButton = document.getElementById('menuButton');
   const navDrawer = document.getElementById('navDrawer');

   if (menuButton) {
     menuButton.addEventListener('click', () => {
       navDrawer.classList.toggle('open');
       if (navDrawer.classList.contains('open')) {
         menuButton.textContent = '✖'; // Change to close icon
       } else {
         menuButton.textContent = '☰'; // Change to menu icon
       }
     });
   }
 });

