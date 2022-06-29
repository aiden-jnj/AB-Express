const request = require('supertest')

const app = require('../index')


describe('GET URL', () => {
  it('200', (done) => {
    request(app)
      .get('/')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err)
        return done()
      })
  })

  it('404', (done) => {
    request(app)
      .get('/not')
      .expect(404)
      .end((err, res) => {
        if (err) return done(err)
        return done()
      })
  })
})
