pipeline {
    agent any

    stages {
        stage('Build Backend Image') {
            steps {
                dir("${WORKSPACE}") {
                    sh 'docker build -t eldersafe-backend -f Dockerfile.backend .'
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                dir("${WORKSPACE}") {
                    sh 'docker build -t eldersafe-frontend -f Dockerfile.frontend .'
                }
            }
        }

        stage('Deploy App') {
            steps {
                dir("${WORKSPACE}") {
                    sh '''
                    docker ps -a --filter "name=frontend" -q | xargs -r docker rm -f || true
                    docker ps -a --filter "name=backend" -q | xargs -r docker rm -f || true

                    docker-compose up -d --build || true
                    '''
                }
            }
        }
    }
}