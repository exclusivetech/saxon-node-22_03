import app from './app/app';

const port = process.env.PORT || 4224;  // invece di 4200 almeno ng serve ...

app.listen(port, () => {
  /* if (err) {
    return console.log(err)
  } */

  return console.log(`server is listening on ${port}`)
})