import Image from "next/image";
import Container from "@/components/ui/Container";
import { Cards, Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { FaArrowAltCircleRight } from "react-icons/fa";

import { auth } from "@/auth";
import { redirect } from "next/navigation";



 


export default async function Home() {
  
  const session = await auth();

  // If you want a logged-out landing page instead, just render it here


  if (session && !session?.isParentOnboarded) {
    redirect("/onboarding");
  }
  return (<>
    
    <div className="min-h-screen bg-[linear-gradient(to_bottom,_#37776c_0%,_#37776c_33%,_#0084B5_33%,_#0084B5_66%,_#EA1938_66%,_#EA1938_100%)] pt-10">
      <Container className="py-10 mb-10  text-center bg-white rounded-2xl text-white">
        <Cards> 
          <Card className='flex mx-10'>
            <div className="flex flex-col items-start gap-y-6">
            <h1 className="text-5xl font-bold text-santa ">Welcome to Spirit of Santa</h1>
            <p className="mt-4 text-xl font-semibold text-evergreen text-left w-2/3">
            Find out if you have been naughty or nice with the Spirit of Santa Naughty/Nice Meter! Once you’ve checked your holiday status, 
            it’s time to dream big! Make your very own Christmas list for Santa himself. Be kind and spread holiday cheer to collect Christmas magic that you can use to unlock FREE 
            stuff! It’s the most magical way to celebrate Christmas because who doesn’t love a little extra holiday magic?
            </p>
            <Button className='bg-santa uppercase '>  Get Started <FaArrowAltCircleRight/></Button>
            </div>
               <Image
              src="/images/santa.png"
              alt="Spirit of Santa"
              width={300}
              height={300}
             
            />
          </Card>
        </Cards>
      </Container>
      <Container className='bg-white rounded-2xl pt-8'>
        <Cards>
          <Card className='bg-santa border-0 p-10'>
            <div className='flex justify-around'>
            <Image
              src="/images/elf.png"
              alt="Spirit of Santa"
              width={250}
              height={250}
              
            />
            <div className='flex flex-col  justify-center'>
            <h2 className="mt-4 text-2xl font-semibold text-white">About Spirit of Santa</h2>
            <p className="mt-2 text-white ">Spirit of Santa (SOS) helps kids keep track of their Christmas List and check their Naughty Nice Meter to make sure they are being good. Kids can earn Christmas Magic by earning good grades, volunteering in their community or performing an act of kindness. </p>
            </div>
            </div>
          </Card>
        </Cards>
        <Cards className="mt-10 mb-10 ">
          <Card className="text-center bg-blueberry border-0 text-white">
            <Image
              src="/images/home1.svg"
              alt="Spirit of Santa"
              width={300}
              height={300}
            
            />
            <h2 className="mt-4 text-2xl font-semibold">Naughty Nice Meter</h2>
            <p className="mt-2 ">You can check your naughty nice meter everyday to see if you got your nice point for the day. If not, no sweat, you can do better tomorrow, but don't forget Christmas is coming. </p>
          </Card>
          <Card className="text-center bg-evergreen border-0 text-white">
            <Image
              src="/images/home2.svg"
              alt="Spirit of Santa"
              width={300}
              height={300}
              className="mx-auto"
            />
            <h2 className="mt-4 text-2xl font-semibold">Christmas Magic</h2>
            <p className="mt-2 ">Christmas is about giving and with Christmas Magic you can earn points to get free stuff. Earn magic by helping others and doing well in school. Find out how much Christmas Magic you can earn this year!</p>
          </Card>
        </Cards>
        <Cards className="mb-10">
          <Card className="text-center bg-berryPink text-white">
            <Image
              src="/images/home3.svg"
              alt="Spirit of Santa"
              width={300}
              height={300}
              className="mx-auto"
            />
            <h2 className="mt-4 text-2xl font-semibold">Christmas List</h2>
            <p className="mt-2">Create your Christmas list that you can change and update all year long. Lots of toys to choose from to have the best Christmas ever! No more letters to santa needed, he can see everything right here on you customizable list. Earn Christmas Magic points and get stuff for free.   </p>
          </Card>
        </Cards>
      </Container>
    </div>


  </>);
}


