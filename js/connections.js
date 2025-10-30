const connectionsListContainer = document.getElementById(
  "connections-list-container"
);
const connectionsListContainerHideButton = document.getElementById(
  "connections-list-container-hide-button"
);

const connectionNameInput = document.getElementById("connection-name-input");
const connectionsListElement = document.getElementById("connections-list");
const loadConnectionsButton = document.getElementById(
  "load-connections-button"
);
const saveConnectionButton = document.getElementById("save-connection-button");
const deleteConnectionButton = document.getElementById(
  "delete-connection-button"
);

loadConnectionsButton.addEventListener("click", () => {
  db.getConnections((connections) => {
    connectionsListContainer.classList.add("visible");

    connectionsListElement.innerHTML = ""; // Clear previous connections
    connections.forEach((connection) => {
      const connectionItem = document.createElement("li");
      connectionItem.textContent = connection.name;
      connectionItem.dataset.connectionKey = connection.id;

      connectionItem.addEventListener("click", () => {
        getConnection(connection.id, (connection) => {
          connectionsListContainer.classList.remove("visible");
          db.reloadContent();
        });
      });

      connectionsListElement.appendChild(connectionItem);
    });

    const newConnectionItem = document.createElement("li");
    newConnectionItem.textContent = "Add New Connection";
    newConnectionItem.addEventListener("click", () => {
      db.loadEmptyConnection(() => {
        connectionsListContainer.classList.remove("visible");
        db.reloadContent();
      });
    });
    connectionsListElement.appendChild(newConnectionItem);
  });
});

connectionsListContainerHideButton.addEventListener("click", () => {
  connectionsListContainer.classList.remove("visible");
});

saveConnectionButton.addEventListener("click", () => {
  const connectionName = connectionNameInput.textContent.trim();
  db.saveConnection(connectionName, (connectionKey) => {
    console.log("Connection saved with key:", connectionKey);
  });
});

deleteConnectionButton.addEventListener("click", () => {
  db.deleteCurrentConnection();
});

function setConnectionContent(connectionName) {
  connectionNameInput.textContent = connectionName || "connection name here";
}

export { setConnectionContent };
