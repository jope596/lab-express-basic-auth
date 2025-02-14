const { Router } = require('express');
const router = new Router();

const bcryptjs = require('bcryptjs');
const saltRounds = 10;

const mongoose = require('mongoose')

const User = require('../models/User.model');

// GET route ==> to display the signup form to user

router.get('/signup', (req, res,next) => res.render('auth/signup'));

router.get('/userProfile', (req, res,next) => res.render('profile/user-profile'));

router.get('/login', (req, res,next)=> res.render('auth/login'))

router.get('/userProfile', (req, res,next) => {
    res.render('profile/user-profile', { userInSession: req.session.currentUser });
  });

  router.post('/signup', (req, res, next) => {
    const {username, email, password} = req.body;
    if (!username || !email || !password) {
        res.render('auth/signup', { errorMessage: 'All fields are mandatory' });
        return;
    }
    bcryptjs
    .genSalt(saltRounds)
    .then(salt => bcryptjs.hash(password, salt))
    .then(hashedPassword => {
        return User.create({
            username,
            email:{
                type: String,
                required: [true, 'Email is required.'],
                // this match will disqualify all the emails with accidental empty spaces, missing dots in front of (.)com and the ones with no domain at all
                match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'],
                unique: true,
                lowercase: true,
                trim: true
            },
            passwordHash : hashedPassword
        });
    })
    .then(userFromDb => {
        res.redirect('userProfile')
    })
    .catch(error => {
        if (error instanceof mongoose.Error.ValidationError) {
            res.status(500).render('auth/signup', { errorMessage: error.message });
        }else if(error.code === 9000){
            res.status(500).render('auth/signup', {
                errorMessage: 'Username or email are already in use. Please try again.'
            })

        } else {
             next(error)};
  });
})

router.post('/login', (req, res, next) => {
    console.log('SESSION =====>', req.session);
    const { email, password } = req.body;

    if (email === '' || password === '') {
      res.render('auth/login', {
        errorMessage: 'All fields must be completed'
      });
      return;
    }

    User.findOne({ email })
      .then(user => {
        if (!user) {
          res.render('auth/login', { errorMessage: 'Email is not registered. Try with other email.' });
          return;
        } else if (bcryptjs.compareSync(password, user.passwordHash)) {
       
          req.session.currentUser = user;
         
          res.redirect('/userProfile')
        } else {
          res.render('auth/login', { errorMessage: 'Incorrect password.' });
        }
      })
      .catch(error => next(error));
  });



module.exports = router;