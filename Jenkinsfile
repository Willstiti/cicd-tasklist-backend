pipeline {
    agent any

    environment {
        DOCKER_IMAGE          = 'willstiti/tasklist-backend'
        SONAR_PROJECT_KEY     = 'Willstiti_cicd-tasklist-backend'
    }

    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Generate Prisma Client') {
            steps {
                sh 'npx prisma generate'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Unit Tests + Coverage') {
            steps {
                sh 'npm run test:coverage'
            }
            post {
                always {
                    // Publie les résultats si vous générez un rapport JUnit (vitest-junit-reporter)
                    junit allowEmptyResults: true, testResults: 'reports/junit.xml'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                        sh """
                            sonar-scanner \
                              -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                              -Dsonar.sources=src \
                              -Dsonar.exclusions=src/app.ts,src/server.ts,src/routes/**,src/lib/**,src/__tests__/**/*.test.ts \
                              -Dsonar.tests=src/__tests__ \
                              -Dsonar.test.inclusions=src/__tests__/**/*.test.ts \
                              -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                              -Dsonar.token=${SONAR_TOKEN}
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                    docker buildx build \
                      --platform linux/amd64 \
                      -t ${DOCKER_IMAGE}:${BUILD_NUMBER} \
                      -t ${DOCKER_IMAGE}:latest \
                      --sbom=true \
                      --provenance=true \
                      --load \
                      .
                """
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_PASS')]) {
                    sh 'echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin'
                    sh """
                        docker buildx build \
                          --platform linux/amd64 \
                          -t ${DOCKER_IMAGE}:${BUILD_NUMBER} \
                          -t ${DOCKER_IMAGE}:latest \
                          --sbom=true \
                          --provenance=true \
                          --push \
                          .
                    """
                }
            }
        }
    }

    post {
        always {
            script {
                try {
                    sh 'docker logout || true'
                } catch (Exception e) {
                    echo "docker logout ignoré (pas de contexte node/workspace): ${e.getClass().getSimpleName()}"
                }
                try {
                    cleanWs()
                } catch (Exception e) {
                    echo "cleanWs ignoré (pas de workspace): ${e.getClass().getSimpleName()}"
                }
            }
        }
        success {
            echo "Pipeline backend terminé avec succès - image poussée : ${DOCKER_IMAGE}:${BUILD_NUMBER}"
        }
        failure {
            echo 'Pipeline backend en échec - voir les logs ci-dessus.'
        }
    }
}