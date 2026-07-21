import { sample } from 'underscore';

export class RandomStringHelperService {

    getRandomCharacters(len: number): string {
        const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let randomString = '';
        for (let i = 0; i < len; i++) {
            const randomPosition = Math.floor(Math.random() * charSet.length);
            randomString += charSet.substring(randomPosition, randomPosition + 1);
        }
        return randomString;
    }

    getRandomNumbersByLength(len: number): string {
        const randomNumbers = Math.floor(10093404234099 + Math.random() * 90010234092439);
        const randomNum = String(randomNumbers);
        return randomNum.substring(0, Number(len));
    }
}

export const getRandomThumbnailImage: any = () => sample([
    'https://cdn.pixabay.com/photo/2015/12/01/20/28/fall-1072821_960_720.jpg',
    'https://cdn.pixabay.com/photo/2020/02/25/09/57/luang-prabang-4878453_960_720.jpg',
    'https://cdn.pixabay.com/photo/2016/11/08/05/31/boys-1807545_960_720.jpg',
    'https://cdn.pixabay.com/photo/2016/01/08/11/57/butterfly-1127666_960_720.jpg',
    'https://cdn.pixabay.com/photo/2012/03/01/00/55/flowers-19830_960_720.jpg',
    'https://cdn.pixabay.com/photo/2017/01/31/09/30/raspberry-2023404_960_720.jpg',
    'https://cdn.pixabay.com/photo/2017/10/09/19/29/eat-2834549_960_720.jpg',
    'https://cdn.pixabay.com/photo/2016/08/11/08/04/vegetables-1584999_960_720.jpg',
    'https://cdn.pixabay.com/photo/2014/12/11/02/55/corn-syrup-563796_960_720.jpg',
    'https://cdn.pixabay.com/photo/2015/04/08/13/13/food-712665_960_720.jpg',
    'https://cdn.pixabay.com/photo/2017/01/26/02/06/platter-2009590_960_720.jpg',
    'https://cdn.pixabay.com/photo/2013/11/12/01/29/bar-209148_960_720.jpg',
    'https://cdn.pixabay.com/photo/2016/11/29/12/54/bar-1869656_960_720.jpg',
    'https://cdn.pixabay.com/photo/2018/04/17/11/03/cocktail-3327242_960_720.jpg',
    'https://cdn.pixabay.com/photo/2016/05/06/17/06/ballet-1376250_960_720.jpg',
    'https://cdn.pixabay.com/photo/2016/11/08/05/41/asia-1807558_960_720.jpg',
    'https://cdn.pixabay.com/photo/2017/06/18/18/26/holi-2416686_960_720.jpg',
    'https://cdn.pixabay.com/photo/2019/06/13/16/06/dance-4271941_960_720.jpg',
    'https://cdn.pixabay.com/photo/2016/04/24/11/40/girl-1349270_960_720.jpg',
], 1)[0];
