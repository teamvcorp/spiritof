import Image from "next/image";
import Container from "@/components/ui/Container";
import { Cards, Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { FaArrowAltCircleRight } from "react-icons/fa";
import Link from "next/link";
import ChristmasCountdown from "@/components/feature/ChristmasCountdown";

import { auth } from "@/auth";



 


export default async function Home() {
  
  const session = await auth();

  // Determine the appropriate call-to-action based on user state
  const getCallToAction = () => {
    if (!session) {
      // Not logged in - show login button
      return (
        <Link href="/auth">
          <Button className='bg-santa link-btn '>
             Get Started<FaArrowAltCircleRight/>
          </Button>
        </Link>
      );
    } else if (!session.isParentOnboarded) {
      // Logged in but needs onboarding
      return (
        <Link href="/onboarding">
          <Button className='bg-santa uppercase text-white mt-2 self-center md:self-start'>
            Complete Setup<FaArrowAltCircleRight/>
          </Button>
        </Link>
      );
    } else {
      // Fully set up - go to children list (no PIN required, child-friendly)
      return (
        <Link href="/children/list">
          <Button className='bg-santa uppercase text-white mt-2 self-center md:self-start'>
            View Christmas Lists<FaArrowAltCircleRight/>
          </Button>
        </Link>
      );
    }
  };
  return (<>
    
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#005574] via-[#032255] to-[#001a33] py-10  lg:mt-10 px-6 sm:px-8 md:px-4">
      
      {/* Christmas Countdown Section */}
      <div className="mx-4 sm:mx-6 md:mx-0 mb-10">
        <ChristmasCountdown />
      </div>

      <div className="mx-4 sm:mx-6 md:mx-0">
      <Container className="py-10 mb-10 text-center bg-white/95 backdrop-blur-sm rounded-lg text-evergreen px-4 sm:px-8 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
        <Cards> 
          <Card className='flex flex-col md:flex-row flex-wrap items-center gap-6 md:gap-8 mx-0 md:mx-10 bg-transparent border-0 shadow-none'>
            <div className="flex flex-col items-center md:items-start md:justify-center gap-y-6 min-w-0 flex-1 text-center md:text-left">
            <h1 className="text-santa md:text-5xl text-4xl lg:text-5xl">Welcome to Spirit of Santa</h1>
            <p className="mt-3 text-evergreen w-full lg:text-lg md:min-w-2/3 md:mx-0 mx-auto"> Find out if you have been naughty or nice with the Spirit of Santa Naughty/Nice Meter! Once you’ve checked your holiday status, 
            it’s time to dream big! Make your very own Christmas list for Santa himself. Be kind and spread holiday cheer to collect Christmas magic that you can use to unlock FREE 
            stuff! It’s the most magical way to celebrate Christmas because who doesn’t love a little extra holiday magic?
            </p>
            {getCallToAction()}
            </div>
            <div className="">
               <Image
              src="/images/santa.png"
              alt="Spirit of Santa"
              width={300}
              height={300}
             sizes="(max-width: 640px) 10rem, (max-width: 768px) 14rem, 300px"
            className="hidden lg:block md:block md:w-[150px] lg:w-[300px] h-auto"
            />

            </div>
          </Card>
        </Cards>
      </Container>
      </div>
      <div className="mx-4 sm:mx-6 md:mx-0">
      <Container className='bg-white/95 backdrop-blur-sm mb-10 rounded-lg pt-8 px-4 sm:px-8 shadow-[0_4px_12px_rgba(0,0,0,0.15)]'>
        <Cards>
          <Card className='bg-santa border-0 p-8 md:p-10 md:min-h-[360px] shadow-[0_4px_12px_rgba(0,0,0,0.15)]'>
            <div className='flex flex-col md:flex-row items-center gap-6 md:gap-10'>
               <div className="shrink-0 w-40 sm:w-56 md:w-[300px]">
            <Image
              src="/images/elf.png"
              alt="Spirit of Santa"
              width={300}
              height={300}
               sizes="(max-width: 640px) 10rem, (max-width: 768px) 14rem, 300px"
          className="w-full h-auto"
              
            />
            </div>
            <div className='min-w-0 flex-1 text-center md:text-left'>
            <h2 className='text-white'>About Spirit of Santa</h2>
            <p className="mt-3 text-white md:max-w-[60ch]">Spirit of Santa (SOS) helps kids keep track of their Christmas List and check their Naughty Nice Meter to make sure they are being good. Kids can earn Christmas Magic by earning good grades, volunteering in their community or performing an act of kindness. </p>
            </div>
            </div>
          </Card>
        </Cards>
        <Cards className="mt-10 mb-10 ">
          <Card className="flex flex-col justify-between text-center bg-blueberry border-0 text-white p-6 md:p-8 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
            <div className="w-full mx-auto flex justify-center ">
            <Image
              src="/images/meter.png"
              alt="Spirit of Santa"
              width={300}
              height={300}
               sizes="(max-width: 640px) 8rem, (max-width: 768px) 10rem, 300px"
            className="md:w-[150px] lg:w-[300px] h-auto self-center"
            
            />
            </div>
            <h2 >Naughty Nice Meter</h2>
            <p className="mt-2 ">You can check your naughty nice meter everyday to see if you got your nice point for the day. If not, no sweat, you can do better tomorrow, but don&rsquo;t forget Christmas is coming. </p>
          </Card>
          <Card className="text-center bg-evergreen border-0 text-white p-6 md:p-8 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
             <div className="min-w-0 w-32 sm:w-40 md:w-[300px] mx-auto">
            <Image
              src="/images/christmasMagic.png"
              alt="Spirit of Santa"
              width={300}
              height={300}
              sizes="(max-width: 640px) 8rem, (max-width: 768px) 10rem, 300px"
            className="w-full h-auto"
            />
            </div>
            <h2 >Christmas Magic</h2>
            <p className="mt-2 ">Christmas is about giving and with Christmas Magic you can earn points to get free stuff. Earn magic by helping others and doing well in school. Find out how much Christmas Magic you can earn this year!</p>
          </Card>
        </Cards>
        <Cards className="mb-10">
          <Card className="flex flex-col md:flex-row items-center mb-10 md:items-center gap-6 md:gap-10 bg-berryPink text-white p-6 md:p-8 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
            <div className=" min-w-0 w-32 shrink-0 sm:w-40 md:w-[300px] mx-auto md:mx-0">
            <Image
              src="/images/elfGift.png"
              alt="Spirit of Santa"
              width={200}
              height={200}
             sizes="(max-width: 640px) 8rem, (max-width: 768px) 10rem, 300px"
            className="w-full h-auto"
            />
            </div>
            <div className='min-w-0 flex-1 text-center md:text-left'>

            <h2>Christmas List</h2>
            <p >Create your Christmas list that you can change and update all year long. Lots of toys to choose from to have the best Christmas ever! No more letters to santa needed, he can see everything right here on you customizable list. Earn Christmas Magic points and get stuff for free.   </p>
            </div>
          </Card>
        </Cards>
      </Container>
      </div>
    </div>


  </>);
}


