colossus.config({
    paths:{
        'loop':'js/loop.js'
    }
});

colossus.init(['loop'],function (loop) {
    console.log('start %s',loop.name);
});

