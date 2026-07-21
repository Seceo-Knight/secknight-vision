<div align="right">
  <img src="https://img.shields.io/badge/OpenSource-000?style=for-the-badge&logo=ghost&logoColor=black&color=ffd700" alt="OpenSource-Badge">
</div>

![SecKnight Vision](../assets/SecKnight%20Vision%20logo.png)
<p align="center"><i>Your Workforce Productivity Compass</i></p>

> **_EmpMonitor: The Worlds #1 Leading Open-Source Platform for Workforce Management & Productivity Enhancement_**
---





## ➤ Microservices Architecture

The **SecKnight Vision Open Source's Backend Microservices Architecture** is a robust system designed to support an Employee Monitoring application by leveraging a microservices architecture. This approach breaks down the backend into smaller, independent services, each dedicated to handling specific tasks such as agent communication, user analytics, data processing, and activity logging. By dividing the system into these specialized components, the architecture ensures better **_scalability_**, **_flexibility_**, and **_maintainability_**. Each microservice operates independently, allowing for easier updates, debugging, and scaling without disrupting the entire system. This modular design is particularly beneficial for applications like EMPMonitor, where diverse functionalities need to work seamlessly together.

To set up the EMPMonitor backend, you’ll need to ensure that essential tools and technologies are in place. Key requirements include `Node.js` for runtime, `NPM` for package management, `PM2` for process management, and databases like `MySQL`, `MongoDB`, and `Redis` for data storage and caching. The installation process involves **_setting up the server environment_**, **_installing dependencies_** for each microservice, and **_configuring the databases_** with the necessary credentials. Once the environment is ready, each microservices such as the `agent-service`, `main-service`, `report-service`, and `store-service` can be started individually using `PM2`. These services are organized into dedicated folders, each responsible for its unique function, ensuring a clean and structured **open-source-friendly** codebase.

Once set up, you can monitor and debug the services using `PM2` logs. This modular approach ensures scalability, flexibility, and easier maintenance, making the EMPMonitor backend efficient and reliable for employee monitoring tasks. 





## ➤ SecKnight Vision Microservices Overview
Below is a detailed breakdown of the key microservices and their responsibilities:
##### :small_blue_diamond: Agent Service
- **Primary Role**: Manages communication with the agent (the software installed on employee devices).
*_Key Functions_*:
- Handles **agent authentication** to ensure secure communication. 
- Acts as the bridge between the agent and the backend system, facilitating data exchange.



##### :small_blue_diamond: Main Service
- **Primary Role**: Serves as the core interface for frontend interactions.
*_Key Functions_*:
- Provides **APIs** for the frontend to fetch and display data.
- Handles **user analytics** and generates reports for administrators.
- Manages **authentication** for both admin and employee dashboards, ensuring secure access.



##### :small_blue_diamond: Report Service
- **Primary Role**: Processes and stores finalized data for reporting purposes.
*_Key Functions_*:
- Collects and processes **activity logs** from employees.
- Generates insights and reports based on the collected data, which are used for performance analysis and decision-making.



##### :small_blue_diamond: Store Service
- **Primary Role**: Manages the storage and validation of user activity data.
*_Key Functions_*:
- Receives **user activity data** (such as web and app usage) from the agent.
- Ensures **data integrity** by preventing duplicate entries and validating incoming data.
- Creates **attendance records** and forwards the finalized data to the **Report Service** for further processing.






## ➤ Pre-Requisites

Here are some pre-requisites to get started:
> [!IMPORTANT]
>
> Ensure `Node.js`, `NPM`, `PM2`, and databases `MySQL, MongoDB, Redis` are installed. Verify versions and configure credentials for seamless setup.



| 🛠️ Requirement | 📌 Version |
|--------------|------------|
| ![Node.js](https://img.icons8.com/color/48/000000/nodejs.png) **Node.js** | `^22 or Latest` |
| ![NPM](https://img.icons8.com/color/48/000000/npm.png) **NPM** | `^11.2.0 or Latest` |
| ![Nodemon](https://img.icons8.com/color/48/000000/monitor.png) **Nodemon** | `^3.1.9 or Latest` |
| 🔥 **Minimum Free Ports** | `5+` |
| ![PM2](https://img.icons8.com/color/48/000000/process.png) **PM2** | `For automation & management` |
| ![MongoDB](https://img.icons8.com/color/48/000000/mongodb.png) **MongoDB** | `Database` |
| ![MySQL](https://img.icons8.com/color/48/000000/mysql.png) **MySQL** | `Database` |
| ![Redis](https://img.icons8.com/color/48/000000/redis.png) **Redis** | `Database` |






## ➤ Folder Structure
```
EMPMonitor_Backend/
│── agent-service/         # Handles agent authentication and communication
│── main-service/          # Frontend API and user analytics
│── report-service/        # Data processing and reporting
│── store-service/         # User activity logging and validation
│── config/                # Configuration files
│── logs/                  # Error and application logs
│── scripts/               # Deployment and maintenance scripts
│── package.json           # Project dependencies and scripts
│── README.md              # Project documentation
```





## ➤ Want to Contribute?
Feel free to fork and [contribute](../Contributions.md) to this project. If you have any questions or need help, don't hesitate to reach out out [Team!]()





## ➤ Conclusion
Your SecKnight Vision backend microservices should now be running successfully. Ensure all services are working as expected by checking logs and database entries. 
 
<!-- ## 🎯 Installation Process

1️⃣ **Requirement Check**  
2️⃣ **Set Up Server Environment**  
3️⃣ **Install Node.js Packages in All Folders**  
4️⃣ **Configure MySQL Database**  
5️⃣ **Update Configuration Files**  
6️⃣ **Build Store Log Module**  
7️⃣ **Start Microservices**  
8️⃣ **Check Error Logs**  

---

## ✅ Step 1: Requirement Check

### 🔍 Checking Installed Versions

#### ✅ Node.js
```sh
  node -v
```
_Expected output:_ `v14.x.x` or later

➡️ [Download Node.js](https://nodejs.org/)

#### ✅ NPM
```sh
  npm -v
```
_Expected output:_ `7.x.x` or later

#### ✅ PM2
```sh
npm install pm2 -g
  pm2 --version
```
_Expected output:_ `Latest PM2 version`

#### ✅ Nodemon
```sh
npm install -g nodemon
  nodemon -v
```
_Expected output:_ `2.x.x` or later

#### ✅ Database Credentials
Ensure MySQL, Redis, and MongoDB credentials are available and properly configured.

---

## ⚙️ Step 2: EMPMonitor Microservices Overview

### 🖥️ EMPMonitor Microservices
The EMPMonitor backend consists of multiple microservices that handle different aspects of the system. Each service is responsible for a specific function and communicates with others via APIs.

#### 🟢 Agent Service
- Manages communication with the agent.
- Handles agent authentication.

#### 🟢 Main Service
- Contains APIs for frontend interaction.
- Handles user analytics and reporting.
- Manages admin and employee authentication for the dashboard.

#### 🟢 Report Service
- Responsible for processing and storing final data.
- Collects and processes activity logs.

#### 🟢 Store Service
- Receives user activity data (web & app usage) from agents.
- Ensures data integrity and prevents duplicate entries.
- Creates attendance records and forwards final data to the report service.

---


## 🚀 Step 3: Installing Dependencies
Run the following command inside each microservice folder to install dependencies:
```sh
  npm install
```
Repeat this step for `agent-service`, `main-service`, `report-service`, and `store-service`.

---

## ⚙️ Step 4: Configure MySQL Database
Ensure MySQL is installed and running. Create the necessary database:
```sh
  mysql -u root -p -e "CREATE DATABASE empmonitor_db;"
```
Update your `.env` files in each microservice with the database credentials.

---

## ▶️ Step 5: Start Microservices
Each microservice must be started separately using PM2:
```sh
  cd agent-service && pm2 start index.js --name agent-service
  cd ../main-service && pm2 start index.js --name main-service
  cd ../report-service && pm2 start index.js --name report-service
  cd ../store-service && pm2 start index.js --name store-service
```
To check running services:
```sh
  pm2 list
```

---

## 🔍 Step 6: Check Logs & Debugging
Check logs for any errors:
```sh
  pm2 logs
```
To restart services if needed:
```sh
  pm2 restart all
```
--- -->



