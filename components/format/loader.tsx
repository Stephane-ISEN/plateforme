export const Loader = () => {
    return (
        <div className={"flex items-center justify-center"}>
            <div className={"animate-spin rounded-full h-6 w-6 border-b-2 border-white dark:border-gray-400"}>
            </div>
            <p className={"p-4 text-white dark:text-black text-center"}>
                Loading
            </p>
        </div>

    )
}