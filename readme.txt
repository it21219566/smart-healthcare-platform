================================================================================
SE3020 - DISTRIBUTED SYSTEMS (2026) - ASSIGNMENT 1
Title: AI-Enabled Smart Healthcare Appointment & Telemedicine Platform
Student Registration Number: IT21219566
================================================================================

1. ARCHITECTURE OVERVIEW & PORTS
--------------------------------------------------------------------------------
- Next.js Web Client          : http://localhost:3000
- Spring Cloud API Gateway    : http://localhost:8080
- Auth Service                : Port 8081 (PostgreSQL: auth_db)
- Patient Management Service  : Port 8082 (PostgreSQL: patient_db)
- Doctor Management Service   : Port 8083 (PostgreSQL: doctor_db)
- Appointment Service         : Port 8084 (PostgreSQL: appointment_db)
- Notification Service        : Port 8085 (ActiveMQ Consumer)
- Apache ActiveMQ Broker      : Port 61616 (Web Console: http://localhost:8161)
- PostgreSQL 15 Server        : Port 5432

2. DEPLOYMENT OPTION A: DOCKER COMPOSE (RECOMMENDED FOR QUICK TESTING)
--------------------------------------------------------------------------------
Step 1: Clone the repository and navigate to the project root:
        git clone https://github.com/IT21219566/smart-healthcare-platform.git
        cd smart-healthcare-platform

Step 2: Build and start all 9 containers (Postgres, ActiveMQ, 6 Services, UI):
        docker compose up --build -d

Step 3: Retrieve the auto-generated One-Time Administrator Password:
        docker logs auth-service

Step 4: Open http://localhost:3000 in your browser.
        - Sign in as admin@smarthealth.lk using the one-time password from Step 3.
        - Rotate the temporary password on first login to unlock the Admin portal.

3. DEPLOYMENT OPTION B: KUBERNETES (DOCKER DESKTOP K8S / MINIKUBE)
--------------------------------------------------------------------------------
Step 1: Ensure images are built locally via Docker Compose:
        docker compose build

Step 2: Apply the Namespace, Secrets, and ConfigMaps:
        kubectl apply -f k8s/01-namespace-config-secrets.yaml

Step 3: Deploy PostgreSQL and Apache ActiveMQ infrastructure:
        kubectl apply -f k8s/02-infrastructure.yaml

Step 4: Deploy all Microservices and the Next.js Web Client:
        kubectl apply -f k8s/03-microservices.yaml

Step 5: Verify all Pods and Services are running:
        kubectl get pods -n smart-healthcare
        kubectl get svc -n smart-healthcare
================================================================================
