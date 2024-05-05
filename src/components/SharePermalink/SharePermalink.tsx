import { useState } from "react";
import { copyTextToClipboard } from "../../helpers/clipboard";
import FormInput from "../FormInput/FormInput";

const Success = ({
    title,
    text
}) => {
    return (
        <div className="bg-teal-100 border-t-4 border-teal-500 rounded-b text-teal-900 px-4 py-3 shadow-md" role="alert">
        <div className="flex">
            <div className="py-1"><svg className="fill-current h-6 w-6 text-teal-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/></svg></div>
            <div>
            <p className="font-bold">{title}</p>
            <p className="text-sm">{text}</p>
            </div>
        </div>
        </div>
    )
}

const SharePermalink = () => {
    const [didCopy, setDidCopy] = useState<boolean>(false);

    const getUrl = () => {
        return window.location.href;
    }

    const copy = () => {
        copyTextToClipboard(getUrl());
        setDidCopy(true);
    }

    return <>
        <p className="my-2">
            Kopieer de link naar deze weergave:
        </p>
        {didCopy && <div className="my-2 mb-4">
                <Success
                    title="Link is gekopieerd"
                    text="Plak de link in een e-mail of chatbericht om deze met anderen te delen"
                />
        </div>}
        <div className="my-2 flex justify-between">
            <div className="flex-1 flex flex-col justify-center">
                <FormInput
                    type="text"
                    classes="w-full"
                    value={getUrl()}
                />
            </div>
            <div
                className="ml-4 pb-2 flex flex-col justify-center cursor-pointer"
                onClick={copy}
                >
                    {/* Copy icon, via https://stackoverflow.com/a/60023353 */}
                    <span style={{
                        fontSize: '.875em',
                        marginRight: '.125em',
                        position: 'relative',
                        top: '-.25em',
                        left: '-.125em'
                    }}>
                        📄<span style={{
                            position: 'absolute',
                            top: '.25em',
                            left: '.25em'
                        }}>📄</span>
                    </span>
            </div>
        </div>
    </>
}

export default SharePermalink;
