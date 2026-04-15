pipeline {
    agent any

    stages {

        stage('Clone Code') {
            steps {
                git branch: 'kairavi',
                url: 'https://github.com/KairaviPadhariya/ElderSafe.git'
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
                docker-compose down || true
                docker-compose up -d --build
                '''
            }
        }
    }
}