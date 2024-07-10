document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // Attach onsubmit event to compose form
  document.querySelector("#compose-form").onsubmit = submit_email;

  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";

  clear_page("compose");
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  // Clear emails list
  clear_page(mailbox);

  fetch_emails(mailbox);
}

function email_response_alert(message) {
  let email = document.querySelector("#email-response");
  if (message === "Email sent successfully.") {
    email.className = "alert alert-success";
    email.innerHTML = message;
  } else {
    email.className = "alert alert-danger";
    email.innerHTML = message;
  }
  setTimeout(() => {
    email.className = "d-none";
    email.innerHTML = "";
  }, 3000);
}

function submit_email() {
  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: document.querySelector("#compose-recipients").value,
      subject: document.querySelector("#compose-subject").value,
      body: document.querySelector("#compose-body").value,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.message) {
        email_response_alert(result.message);
      } else if (result.error) {
        email_response_alert(result.error);
      }
    });
  load_mailbox("inbox");
  return false;
}

// Fetch emails based on mailbox
function fetch_emails(mailbox) {
  if (document.querySelector(`#emails-${mailbox}`).children.length == 0) {
    fetch(`/emails/${mailbox}`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((result) => {
        result.forEach((email) => {
          const element = document.createElement("div");
          element.className = "email";
          element.innerHTML = `<span>${email.sender}</span>: <p>${email.subject}</p> <span>${email.timestamp}</span>`;
          document.querySelector(`#emails-${mailbox}`).appendChild(element);
        });
      });
  }
}

function clear_page(mailbox) {
  const inbox = document.querySelector("#emails-inbox");
  const sent = document.querySelector("#emails-sent");
  const archive = document.querySelector("#emails-archive");

  if (mailbox === "sent") {
    sent.className = "";
    inbox.className = "d-none";
    archive.className = "d-none";
  } else if (mailbox === "inbox") {
    inbox.className = "";
    sent.className = "d-none";
    archive.className = "d-none";
  } else if (mailbox === "archive") {
    archive.className = "";
    inbox.className = "d-none";
    sent.className = "d-none";
  } else if (mailbox === "compose") {
    inbox.className = "d-none";
    sent.className = "d-none";
    archive.className = "d-none";
  }
}
