pipeline {
  agent any

  stages {

    stage('Build & Deploy') {
      steps {
        sh '''
        docker-compose down

        docker system prune -a -f

        docker-compose up -d --build
        '''
      }
    }

  }
}
