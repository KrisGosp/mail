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
    headers: {
      "Content-Type": "application/json",
    },
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
  load_mailbox("sent");
  return false;
}

// Fetch emails based on mailbox
function fetch_emails(mailbox) {
  fetch(`/emails/${mailbox}`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((result) => {
      result.forEach((email) => {
        const element = document.createElement("div");

        if (email.read && mailbox === "inbox") {
          element.classList.add("email", "bg-secondary");
        } else {
          element.classList.add("email", "bg-white");
        }
        element.innerHTML = `
          <p>${email.subject}</p>
          <div class="d-flex justify-content-between">
            <span>${email.sender}</span>
            <span>${email.timestamp}</span>
          </div>
          `;
        element.addEventListener("click", function () {
          single_email(email.id);
        });
        document.querySelector(`#emails-${mailbox}`).append(element);
      });
    });
}

function clear_page(mailbox) {
  const inbox = document.querySelector("#emails-inbox");
  const sent = document.querySelector("#emails-sent");
  const archive = document.querySelector("#emails-archive");

  if (mailbox === "sent") {
    sent.className = "";
    sent.innerHTML = "";
    inbox.className = "d-none";
    archive.className = "d-none";
  } else if (mailbox === "inbox") {
    inbox.className = "";
    inbox.innerHTML = "";
    sent.className = "d-none";
    archive.className = "d-none";
  } else if (mailbox === "archive") {
    archive.className = "";
    archive.innerHTML = "";
    inbox.className = "d-none";
    sent.className = "d-none";
  } else if (mailbox === "compose") {
    inbox.className = "d-none";
    sent.className = "d-none";
    archive.className = "d-none";
  }
}

function single_email(email_id) {
  clear_page("inbox");
  fetch(`/emails/${email_id}`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((result) => {
      document.querySelector("#emails-inbox").className = "";
      document.querySelector("#emails-inbox").innerHTML = `
        <ul class="list-group">
          <li class="list-group-item">Sender: ${result.sender}</li>
          <li class="list-group-item">Recipients: ${result.recipients}</li>
          <li class="list-group-item">Subject: ${result.subject}</li>
          <li class="list-group-item">Body: ${result.body}</li>
          <li class="list-group-item">Sent: ${result.timestamp}</li>
        </ul>
      `;

      if (document.querySelector("#emails-view").innerHTML != "<h3>Sent</h3>") {
        // Add archive button
        const btn_archive = document.createElement("button");
        btn_archive.innerHTML = result.archived ? "Unarchive" : "Archive";
        btn_archive.className = result.archived
          ? "btn btn-outline-secondary"
          : "btn btn-outline-primary";

        btn_archive.addEventListener("click", function () {
          fetch(`/emails/${email_id}`, {
            method: "PUT",
            body: JSON.stringify({
              archived: !result.archived,
            }),
          }).then(() => load_mailbox("inbox"));
        });
        document.querySelector("#emails-inbox").append(btn_archive);

        // Add reply button
        const btn_reply = document.createElement("button");
        btn_reply.innerHTML = "Reply";
        btn_reply.className = "btn btn-outline-primary";
        btn_reply.addEventListener("click", function () {
          compose_email();

          document.querySelector("#compose-recipients").value = result.sender;
          let subject = result.subject;
          if (subject.split(" ", 1)[0] != "Re:") {
            subject = `Re: ${result.subject}`;
          }

          document.querySelector("#compose-subject").value = subject;
          document.querySelector(
            "#compose-body"
          ).value = `On ${result.timestamp} ${result.sender} wrote:\n\n${result.body}`;
        });

        document.querySelector("#emails-inbox").append(btn_reply);
      }
      if (!result.read) {
        fetch(`/emails/${email_id}`, {
          method: "PUT",
          body: JSON.stringify({
            read: true,
          }),
        });
      }
    });
}
