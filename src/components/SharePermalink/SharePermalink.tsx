import FormInput from "../FormInput/FormInput";

const SharePermalink = () => {

    const getUrl = () => {
        return window.location.href;
    }

    return <>
        <p className="my-2">
            Kopieer de link naar deze weergave:
        </p>
        <div className="my-2">
            <FormInput
                type="text"
                classes="w-full"
                value={getUrl()}
            />
        </div>
    </>
}

export default SharePermalink;
