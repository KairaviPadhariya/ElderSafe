pipeline {
    agent any

    stages {

        stage('Checkout Code') {
            steps {
                git 'https://github.com/KairaviPadhariya/ElderSafe.git'
            }
        }

        stage('Build Backend Image') {
            steps {
                sh 'docker build -t eldersafe-backend -f Dockerfile.backend .'
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh 'docker build -t eldersafe-frontend -f Dockerfile.frontend .'
            }
        }

        stage('Deploy App') {
            steps {
                sh '''
                docker ps -a --filter "name=frontend" -q | xargs -r docker rm -f || true
                docker ps -a --filter "name=backend" -q | xargs -r docker rm -f || true

                docker-compose up -d --build
                '''
            }
        }
    }
}