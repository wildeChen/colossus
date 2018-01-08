colossus.config({
    paths:{
        'loop':'js/loop'
    }
});

colossus.init(['loop'],function (loop) {
    console.log('start %s',loop.name);
});

