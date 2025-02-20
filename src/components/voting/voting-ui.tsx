"use client";

import { PublicKey } from "@solana/web3.js";
import { ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import {
  useVotingProgram,
  useVotingProgramAccount,
} from "./voting-data-access";

export function VotingCreate() {
  const { initializePoll } = useVotingProgram();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() =>
        initializePoll.mutateAsync({
          pollId: Date.now(),
          description: "New Poll",
          pollStart: Date.now(),
          pollEnd: Date.now() + 86400000,
        })
      }
      disabled={initializePoll.isPending}
    >
      Create Poll {initializePoll.isPending && "..."}
    </button>
  );
}

export function VotingList() {
  const { polls, getProgramAccount } = useVotingProgram();

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>
          Program account not found. Make sure you have deployed the program and
          are on the correct cluster.
        </span>
      </div>
    );
  }
  return (
    <div className={"space-y-6"}>
      {polls.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : polls.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {polls.data?.map((poll) => (
            <VotingCard
              key={poll.publicKey.toString()}
              account={poll.publicKey}
            />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={"text-2xl"}>No polls</h2>
          No polls found. Create one above to get started.
        </div>
      )}
    </div>
  );
}

function VotingCard({ account }: { account: PublicKey }) {
  const { pollQuery, vote } = useVotingProgramAccount({
    pollId: account.toBuffer()[0],
  });

  const poll = pollQuery.data;

  return pollQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4 text-neutral-content">
      <div className="card-body items-center text-center">
        <div className="space-y-6">
          <h2
            className="card-title justify-center text-3xl cursor-pointer"
            onClick={() => pollQuery.refetch()}
          >
            {poll?.description}
          </h2>
          <div className="card-actions justify-around">
            <button
              className="btn btn-xs lg:btn-md btn-outline"
              onClick={() => vote.mutateAsync({ candidateName: "Option A" })}
              disabled={vote.isPending}
            >
              Vote Option A
            </button>
            <button
              className="btn btn-xs lg:btn-md btn-outline"
              onClick={() => vote.mutateAsync({ candidateName: "Option B" })}
              disabled={vote.isPending}
            >
              Vote Option B
            </button>
          </div>
          <div className="text-center space-y-4">
            <p>
              <ExplorerLink
                path={`account/${account}`}
                label={ellipsify(account.toString())}
              />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
