pipeline {
    agent any

    stages {

        stage('Build Backend Image') {
            steps {
                sh '''
                    pwd
                    ls
                    docker build -t eldersafe-backend -f Dockerfile.backend .
                '''
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh '''
                    docker build -t eldersafe-frontend -f Dockerfile.frontend .
                '''
            }
        }

        stage('Deploy App') {
            steps {
                sh '''
                    pwd
                    ls
                    cd $WORKSPACE
                    docker-compose down || true
                    docker-compose up -d --build
                '''
            }
        }
    }
}